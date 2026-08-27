import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { prisma } from "@/lib/prisma";
import {
  getAnalyticsServiceAccountEmail,
  isAnalyticsConfigured,
} from "@/lib/googleAnalyticsClient";
import { clearAnalyticsCache } from "@/lib/googleAnalyticsReports";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  const office = await requireOfficeNetwork("/api/admin/analytics/status");
  if (office.error) return office.error;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const [total, active] = await Promise.all([
      prisma.analyticsProperty.count(),
      prisma.analyticsProperty.count({ where: { isActive: true } }),
    ]);

    const configured = isAnalyticsConfigured();
    const email = getAnalyticsServiceAccountEmail();

    return NextResponse.json(
      {
        configured,
        connected: configured,
        serviceAccountEmail: email,
        totalProperties: total,
        activeProperties: active,
        cacheSeconds: Number(process.env.ANALYTICS_CACHE_SECONDS ?? "900"),
        // Never include private keys
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request) {
  const office = await requireOfficeNetwork("/api/admin/analytics/status");
  if (office.error) return office.error;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
    };
    if (body.action === "clear-cache") {
      clearAnalyticsCache();
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return handleApiError(e);
  }
}

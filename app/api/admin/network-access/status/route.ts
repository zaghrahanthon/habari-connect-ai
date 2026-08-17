import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDeniedAccessSummaries } from "@/lib/accessLog";
import {
  getOfficeAllowlist,
  getRequestIp,
  isIpAllowed,
  requireOfficeNetwork,
} from "@/lib/networkAccess";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const office = await requireOfficeNetwork("/api/admin/network-access/status");
  if (office.error) return office.error;

  const { error } = await requireAdmin();
  if (error) return error;

  const headerStore = await headers();
  const detectedIp = getRequestIp(headerStore);
  const allowed = isIpAllowed(detectedIp);

  return NextResponse.json(
    {
      detectedIp,
      allowed,
      environment: process.env.VERCEL
        ? "vercel"
        : process.env.NODE_ENV ?? "development",
      allowlistEntryCount: getOfficeAllowlist().length,
      recentDenied: getDeniedAccessSummaries(10),
      localDevelopmentBypass:
        process.env.NODE_ENV === "development" &&
        (process.env.ALLOW_LOCAL_DEVELOPMENT ?? "true") !== "false",
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { prisma } from "@/lib/prisma";
import { analyticsPropertySchema } from "@/lib/validations/analytics";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { testAnalyticsPropertyConnection } from "@/lib/googleAnalyticsReports";
import {
  AnalyticsAccessError,
  AnalyticsConfigError,
} from "@/lib/googleAnalyticsClient";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const office = await requireOfficeNetwork(
    "/api/admin/analytics/properties/[id]",
  );
  if (office.error) return office.error;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const data = analyticsPropertySchema.parse(await request.json());
    const property = await prisma.analyticsProperty.update({
      where: { id },
      data: {
        propertyId: data.propertyId.trim(),
        name: data.name.trim(),
        brand: data.brand?.trim() || null,
        websiteUrl: data.websiteUrl?.trim() || null,
        description: data.description?.trim() || null,
        isActive: data.isActive,
        displayOrder: data.displayOrder ?? 0,
      },
    });
    return NextResponse.json(property);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const office = await requireOfficeNetwork(
    "/api/admin/analytics/properties/[id]",
  );
  if (office.error) return office.error;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.analyticsProperty.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request, { params }: Params) {
  const office = await requireOfficeNetwork(
    "/api/admin/analytics/properties/[id]/test",
  );
  if (office.error) return office.error;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
    };
    if (body.action !== "test") {
      return jsonError('Expected { "action": "test" }', 400);
    }

    const property = await prisma.analyticsProperty.findUnique({
      where: { id },
    });
    if (!property) return jsonError("Not found", 404);

    const result = await testAnalyticsPropertyConnection(property.propertyId);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AnalyticsConfigError || e instanceof AnalyticsAccessError) {
      return jsonError(e.message, 503);
    }
    return handleApiError(e);
  }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { prisma } from "@/lib/prisma";
import { analyticsPropertySchema } from "@/lib/validations/analytics";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  const office = await requireOfficeNetwork("/api/admin/analytics/properties");
  if (office.error) return office.error;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const properties = await prisma.analyticsProperty.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(properties, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request) {
  const office = await requireOfficeNetwork("/api/admin/analytics/properties");
  if (office.error) return office.error;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const data = analyticsPropertySchema.parse(await request.json());
    const property = await prisma.analyticsProperty.create({
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
    return NextResponse.json(property, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

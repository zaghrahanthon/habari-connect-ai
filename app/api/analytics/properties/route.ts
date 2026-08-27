import { NextResponse } from "next/server";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";

/** List active GA properties for employees (no credentials). */
export async function GET() {
  const office = await requireOfficeNetwork("/api/analytics/properties");
  if (office.error) return office.error;

  try {
    const properties = await prisma.analyticsProperty.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        propertyId: true,
        name: true,
        brand: true,
        websiteUrl: true,
        description: true,
        displayOrder: true,
      },
    });

    return NextResponse.json(
      { properties },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return handleApiError(e);
  }
}

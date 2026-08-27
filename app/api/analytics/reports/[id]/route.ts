import { NextResponse } from "next/server";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const office = await requireOfficeNetwork("/api/analytics/reports/[id]");
  if (office.error) return office.error;

  try {
    const { id } = await params;
    const report = await prisma.analyticsReport.findUnique({ where: { id } });
    if (!report) return jsonError("Report not found", 404);

    const property = await prisma.analyticsProperty.findUnique({
      where: { propertyId: report.propertyId },
      select: { name: true, brand: true, websiteUrl: true },
    });

    return NextResponse.json(
      { ...report, property },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const office = await requireOfficeNetwork("/api/analytics/reports/[id]");
  if (office.error) return office.error;

  try {
    const { id } = await params;
    await prisma.analyticsReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}

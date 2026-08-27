import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

type ReportData = {
  property?: { name?: string; brand?: string | null };
  range?: { startDate?: string; endDate?: string };
  overview?: {
    kpis?: Array<{
      label: string;
      value: number;
      changePercent: number | null;
    }>;
  };
  traffic?: { rows?: Array<{ dimensions: Record<string, string>; metrics: Record<string, number> }> };
  content?: { rows?: Array<{ dimensions: Record<string, string>; metrics: Record<string, number> }> };
  devices?: { rows?: Array<{ dimensions: Record<string, string>; metrics: Record<string, number> }> };
  locations?: { rows?: Array<{ dimensions: Record<string, string>; metrics: Record<string, number> }> };
  generatedAt?: string;
};

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n > 0 && n < 1) return `${(n * 100).toFixed(1)}%`;
  return Math.round(n).toLocaleString("en-ZA");
}

export async function GET(_request: Request, { params }: Params) {
  const office = await requireOfficeNetwork(
    "/api/analytics/reports/[id]/pdf",
  );
  if (office.error) return office.error;

  try {
    const { id } = await params;
    const report = await prisma.analyticsReport.findUnique({ where: { id } });
    if (!report) return jsonError("Report not found", 404);

    const data = report.reportData as ReportData;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Habari Media", margin, y);
    y += 24;
    doc.setFontSize(14);
    doc.text("Analytics Performance Report", margin, y);
    y += 28;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const meta = [
      `Report: ${report.name}`,
      `Brand: ${data.property?.brand || data.property?.name || report.propertyId}`,
      `Date range: ${data.range?.startDate ?? ""} – ${data.range?.endDate ?? ""}`,
      `Generated: ${data.generatedAt ? new Date(data.generatedAt).toLocaleString("en-ZA") : new Date().toLocaleString("en-ZA")}`,
    ];
    for (const line of meta) {
      doc.text(line, margin, y);
      y += 14;
    }
    y += 10;

    if (report.aiSummary) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("AI Analysis — Executive Summary", margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const summaryLines = doc.splitTextToSize(
        report.aiSummary.replace(/#{1,6}\s?/g, "").slice(0, 2500),
        500,
      );
      for (const line of summaryLines.slice(0, 40)) {
        if (y > 760) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 12;
      }
      y += 12;
    }

    const kpis = data.overview?.kpis ?? [];
    if (kpis.length > 0) {
      if (y > 680) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("KPI Overview", margin, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Metric", "Value", "vs Previous"]],
        body: kpis.map((k) => [
          k.label,
          fmt(k.value),
          k.changePercent == null
            ? "n/a"
            : `${k.changePercent > 0 ? "+" : ""}${k.changePercent.toFixed(1)}%`,
        ]),
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        ?.finalY ?? y) + 20;
    }

    const channels = data.traffic?.rows ?? [];
    if (channels.length > 0) {
      if (y > 680) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Traffic Sources", margin, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Channel", "Sessions", "Users", "Engagement Rate"]],
        body: channels.slice(0, 15).map((r) => [
          r.dimensions.sessionDefaultChannelGroup ?? "—",
          fmt(r.metrics.sessions ?? 0),
          fmt(r.metrics.totalUsers ?? 0),
          fmt(r.metrics.engagementRate ?? 0),
        ]),
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        ?.finalY ?? y) + 20;
    }

    const pages = data.content?.rows ?? [];
    if (pages.length > 0) {
      if (y > 680) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Top Content", margin, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Page", "Views", "Users"]],
        body: pages.slice(0, 15).map((r) => [
          (r.dimensions.pageTitle || r.dimensions.pagePath || "—").slice(0, 60),
          fmt(r.metrics.screenPageViews ?? 0),
          fmt(r.metrics.totalUsers ?? 0),
        ]),
        styles: { fontSize: 8 },
        margin: { left: margin, right: margin },
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        ?.finalY ?? y) + 20;
    }

    const devices = data.devices?.rows ?? [];
    if (devices.length > 0) {
      if (y > 680) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Devices", margin, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Device", "Users", "Sessions"]],
        body: devices.map((r) => [
          r.dimensions.deviceCategory ?? "—",
          fmt(r.metrics.totalUsers ?? 0),
          fmt(r.metrics.sessions ?? 0),
        ]),
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        ?.finalY ?? y) + 20;
    }

    const locations = data.locations?.rows ?? [];
    if (locations.length > 0) {
      if (y > 680) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Audience / Locations", margin, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Country", "City", "Users", "Sessions"]],
        body: locations.slice(0, 15).map((r) => [
          r.dimensions.country ?? "—",
          r.dimensions.city ?? "—",
          fmt(r.metrics.totalUsers ?? 0),
          fmt(r.metrics.sessions ?? 0),
        ]),
        styles: { fontSize: 8 },
        margin: { left: margin, right: margin },
      });
    }

    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 24,
        { align: "center" },
      );
    }

    // TODO: Add CSV and XLSX export.
    const arrayBuffer = doc.output("arraybuffer");
    const filename = `${report.name.replace(/[^a-z0-9-_]+/gi, "_")}.pdf`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return handleApiError(e, "PDF generation failed");
  }
}

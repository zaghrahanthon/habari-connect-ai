import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { prisma } from "@/lib/prisma";
import { analyticsSavedReportSchema } from "@/lib/validations/analytics";
import { requireActiveAnalyticsProperty } from "@/lib/analyticsPropertyGuard";
import { validateDateRange } from "@/lib/analyticsDates";
import {
  getOverviewMetrics,
  getTrafficChannels,
  getTopPages,
  getDeviceBreakdown,
  getLocationBreakdown,
  employeeSafeErrorMessage,
} from "@/lib/googleAnalyticsReports";
import { formatAnalyticsForAi } from "@/lib/analyticsAi";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  AnalyticsAccessError,
  AnalyticsConfigError,
} from "@/lib/googleAnalyticsClient";

export async function GET() {
  const office = await requireOfficeNetwork("/api/analytics/reports");
  if (office.error) return office.error;

  try {
    const reports = await prisma.analyticsReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        propertyId: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const properties = await prisma.analyticsProperty.findMany({
      where: { propertyId: { in: [...new Set(reports.map((r) => r.propertyId))] } },
      select: { propertyId: true, name: true, brand: true },
    });
    const byId = Object.fromEntries(properties.map((p) => [p.propertyId, p]));

    return NextResponse.json(
      {
        reports: reports.map((r) => ({
          ...r,
          propertyName: byId[r.propertyId]?.name ?? r.propertyId,
          brand: byId[r.propertyId]?.brand ?? null,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request) {
  const office = await requireOfficeNetwork("/api/analytics/reports");
  if (office.error) return office.error;

  try {
    const body = analyticsSavedReportSchema.parse(await request.json());
    const range = validateDateRange(body.startDate, body.endDate);
    const { property, error } = await requireActiveAnalyticsProperty(
      body.propertyId,
    );
    if (error || !property) return error!;

    const [overview, traffic, content, devices, locations] = await Promise.all([
      getOverviewMetrics(property.propertyId, range),
      body.sections.includes("trafficSources")
        ? getTrafficChannels(property.propertyId, range)
        : Promise.resolve(null),
      body.sections.includes("topPages")
        ? getTopPages(property.propertyId, range)
        : Promise.resolve(null),
      body.sections.includes("devices")
        ? getDeviceBreakdown(property.propertyId, range)
        : Promise.resolve(null),
      body.sections.includes("audience") || body.sections.includes("locations")
        ? getLocationBreakdown(property.propertyId, range)
        : Promise.resolve(null),
    ]);

    const reportData = {
      property: {
        id: property.id,
        propertyId: property.propertyId,
        name: property.name,
        brand: property.brand,
        websiteUrl: property.websiteUrl,
      },
      range,
      previousRange: overview.previousRange,
      sections: body.sections,
      comparePrevious: body.comparePrevious,
      overview,
      traffic,
      content,
      devices,
      locations,
      generatedAt: new Date().toISOString(),
    };

    let aiSummary: string | null = null;
    if (body.generateAi) {
      aiSummary = await generateAiReportSummary({
        propertyName: property.name,
        brand: property.brand,
        rangeLabel: `${range.startDate} to ${range.endDate}`,
        reportData,
      });
    }

    const saved = await prisma.analyticsReport.create({
      data: {
        name: body.name.trim(),
        propertyId: property.propertyId,
        startDate: new Date(`${range.startDate}T12:00:00.000Z`),
        endDate: new Date(`${range.endDate}T12:00:00.000Z`),
        reportData,
        aiSummary,
      },
    });

    return NextResponse.json(saved, {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    if (e instanceof AnalyticsConfigError || e instanceof AnalyticsAccessError) {
      return jsonError(employeeSafeErrorMessage(e), 503);
    }
    return handleApiError(e, employeeSafeErrorMessage(e));
  }
}

async function generateAiReportSummary(input: {
  propertyName: string;
  brand: string | null;
  rangeLabel: string;
  reportData: unknown;
}): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey === "your_openai_api_key_here") return null;

  const openai = new OpenAI({ apiKey });
  const context = formatAnalyticsForAi({
    propertyName: input.propertyName,
    brand: input.brand,
    rangeLabel: input.rangeLabel,
    data: input.reportData,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 1200,
    messages: [
      {
        role: "system",
        content: `You are Habari Connect AI writing an internal analytics report.
When Google Analytics data is supplied, analyse only the supplied analytics data.
Never invent traffic, user, engagement, page-view or conversion values.
Clearly distinguish facts from interpretation.
Structure your reply with these markdown headings when relevant:
## Executive Summary
## Performance Highlights
## Areas of Growth
## Areas of Decline
## Traffic Source Insights
## Content Insights
## Audience Insights
## Recommendations
Label interpretive commentary as AI Analysis where helpful.`,
      },
      {
        role: "user",
        content: `Create a professional analytics report commentary from this data:\n\n${context}`,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || null;
}

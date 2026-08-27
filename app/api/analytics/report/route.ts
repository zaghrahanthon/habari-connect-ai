import { NextResponse } from "next/server";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { analyticsReportRequestSchema } from "@/lib/validations/analytics";
import { requireActiveAnalyticsProperty } from "@/lib/analyticsPropertyGuard";
import { validateDateRange } from "@/lib/analyticsDates";
import {
  getOverviewMetrics,
  getTrafficChannels,
  getTopPages,
  getLocationBreakdown,
  getTechnologyBreakdown,
  getDailyTrafficTrend,
  employeeSafeErrorMessage,
  clearAnalyticsCache,
} from "@/lib/googleAnalyticsReports";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  AnalyticsAccessError,
  AnalyticsConfigError,
} from "@/lib/googleAnalyticsClient";

export async function POST(request: Request) {
  const office = await requireOfficeNetwork("/api/analytics/report");
  if (office.error) return office.error;

  try {
    const body = analyticsReportRequestSchema.parse(await request.json());
    const range = validateDateRange(body.startDate, body.endDate);
    const { property, error } = await requireActiveAnalyticsProperty(
      body.propertyId,
    );
    if (error || !property) return error!;

    if (body.refresh) clearAnalyticsCache();

    const gaPropertyId = property.propertyId;
    const opts = { bypassCache: body.refresh };

    let payload: unknown;
    switch (body.reportType) {
      case "overview":
        payload = await getOverviewMetrics(gaPropertyId, range, opts);
        break;
      case "traffic":
        payload = await getTrafficChannels(gaPropertyId, range, opts);
        break;
      case "content":
        payload = await getTopPages(gaPropertyId, range, opts);
        break;
      case "audience":
        payload = await getLocationBreakdown(gaPropertyId, range, opts);
        break;
      case "technology":
        payload = await getTechnologyBreakdown(gaPropertyId, range, opts);
        break;
      case "trend":
        payload = await getDailyTrafficTrend(
          gaPropertyId,
          range,
          body.trendMetric,
          opts,
        );
        break;
      default:
        return jsonError("Unsupported report type", 400);
    }

    return NextResponse.json(
      {
        property: {
          id: property.id,
          propertyId: property.propertyId,
          name: property.name,
          brand: property.brand,
        },
        range,
        reportType: body.reportType,
        data: payload,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    if (e instanceof AnalyticsConfigError || e instanceof AnalyticsAccessError) {
      return jsonError(employeeSafeErrorMessage(e), 503);
    }
    return handleApiError(e, employeeSafeErrorMessage(e));
  }
}

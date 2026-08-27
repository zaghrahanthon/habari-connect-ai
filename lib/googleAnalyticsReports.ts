import { createHash } from "crypto";
import {
  AnalyticsAccessError,
  AnalyticsConfigError,
  getAnalyticsCacheSeconds,
  getAnalyticsClient,
  toGaPropertyResource,
} from "@/lib/googleAnalyticsClient";
import { assertAllowedMetrics } from "@/lib/analyticsMetrics";
import { assertAllowedDimensions } from "@/lib/analyticsDimensions";
import {
  getPreviousPeriod,
  percentChange,
  type DateRange,
} from "@/lib/analyticsDates";

export type GaRow = {
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
};

export type GaReportResult = {
  rows: GaRow[];
  rowCount: number;
  metricHeaders: string[];
  dimensionHeaders: string[];
};

export type KpiValue = {
  key: string;
  label: string;
  value: number;
  previous: number | null;
  changePercent: number | null;
};

export type OverviewReport = {
  kpis: KpiValue[];
  range: DateRange;
  previousRange: DateRange;
};

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const memoryCache = new Map<string, CacheEntry>();

// In-memory cache is process-local (sufficient for single-instance / local MVP).
// TODO: Use Redis or another shared cache before multi-instance production.

function cacheKey(parts: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

function getCached<T>(key: string): T | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return hit.value as T;
}

function setCached(key: string, value: unknown) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + getAnalyticsCacheSeconds() * 1000,
  });
}

export function clearAnalyticsCache() {
  memoryCache.clear();
}

function parseMetricNumber(raw: string | null | undefined): number {
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export async function runAnalyticsReport(options: {
  propertyId: string;
  startDate: string;
  endDate: string;
  metrics: string[];
  dimensions?: string[];
  limit?: number;
  orderBys?: Array<{ metric?: string; dimension?: string; desc?: boolean }>;
  bypassCache?: boolean;
}): Promise<GaReportResult> {
  const metrics = assertAllowedMetrics(options.metrics);
  const dimensions = assertAllowedDimensions(options.dimensions ?? []);
  const property = toGaPropertyResource(options.propertyId);
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);

  const key = cacheKey({
    property,
    startDate: options.startDate,
    endDate: options.endDate,
    metrics,
    dimensions,
    limit,
    orderBys: options.orderBys ?? [],
  });

  if (!options.bypassCache) {
    const cached = getCached<GaReportResult>(key);
    if (cached) return cached;
  }

  try {
    const client = getAnalyticsClient();
    const [response] = await client.runReport({
      property,
      dateRanges: [
        { startDate: options.startDate, endDate: options.endDate },
      ],
      metrics: metrics.map((name) => ({ name })),
      dimensions: dimensions.map((name) => ({ name })),
      limit,
      orderBys: (options.orderBys ?? []).map((o) => {
        if (o.metric) {
          return {
            metric: { metricName: o.metric },
            desc: o.desc ?? true,
          };
        }
        return {
          dimension: { dimensionName: o.dimension! },
          desc: o.desc ?? false,
        };
      }),
    });

    const metricHeaders = (response.metricHeaders ?? []).map(
      (h) => h.name ?? "",
    );
    const dimensionHeaders = (response.dimensionHeaders ?? []).map(
      (h) => h.name ?? "",
    );

    const rows: GaRow[] = (response.rows ?? []).map((row) => {
      const dim: Record<string, string> = {};
      (row.dimensionValues ?? []).forEach((v, i) => {
        dim[dimensionHeaders[i] ?? `d${i}`] = v.value ?? "";
      });
      const met: Record<string, number> = {};
      (row.metricValues ?? []).forEach((v, i) => {
        met[metricHeaders[i] ?? `m${i}`] = parseMetricNumber(v.value);
      });
      return { dimensions: dim, metrics: met };
    });

    const result: GaReportResult = {
      rows,
      rowCount: Number(response.rowCount ?? rows.length),
      metricHeaders,
      dimensionHeaders,
    };
    setCached(key, result);
    return result;
  } catch (error) {
    mapGoogleError(error);
  }
}

function mapGoogleError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("permission") ||
    lower.includes("403") ||
    lower.includes("insufficient")
  ) {
    throw new AnalyticsAccessError(
      "The service account does not have access to this GA4 property. Add it as a Viewer in Google Analytics Admin.",
    );
  }
  if (lower.includes("not found") || lower.includes("404")) {
    throw new AnalyticsAccessError(
      "GA4 property not found. Check the Property ID.",
    );
  }
  if (lower.includes("quota")) {
    throw new AnalyticsAccessError(
      "Google Analytics API quota exceeded. Try again later.",
    );
  }
  if (lower.includes("api has not been used") || lower.includes("disabled")) {
    throw new AnalyticsConfigError(
      "Google Analytics Data API is not enabled for this Google Cloud project.",
    );
  }
  if (error instanceof AnalyticsConfigError || error instanceof AnalyticsAccessError) {
    throw error;
  }
  throw new AnalyticsAccessError(
    "Google Analytics request failed. Check credentials and property configuration.",
  );
}

const KPI_LABELS: Record<string, string> = {
  totalUsers: "Users",
  sessions: "Sessions",
  screenPageViews: "Views",
  engagementRate: "Engagement Rate",
  averageSessionDuration: "Avg Engagement Time",
  newUsers: "New Users",
};

export async function getOverviewMetrics(
  propertyId: string,
  range: DateRange,
  options?: { bypassCache?: boolean },
): Promise<OverviewReport> {
  const metrics = Object.keys(KPI_LABELS);
  const previousRange = getPreviousPeriod(range);

  const [current, previous] = await Promise.all([
    runAnalyticsReport({
      propertyId,
      startDate: range.startDate,
      endDate: range.endDate,
      metrics,
      bypassCache: options?.bypassCache,
    }),
    runAnalyticsReport({
      propertyId,
      startDate: previousRange.startDate,
      endDate: previousRange.endDate,
      metrics,
      bypassCache: options?.bypassCache,
    }),
  ]);

  const currentTotals = current.rows[0]?.metrics ?? {};
  const previousTotals = previous.rows[0]?.metrics ?? {};

  const kpis: KpiValue[] = metrics.map((key) => {
    const value = currentTotals[key] ?? 0;
    const prev = previousTotals[key] ?? 0;
    return {
      key,
      label: KPI_LABELS[key] ?? key,
      value,
      previous: prev,
      changePercent: percentChange(value, prev),
    };
  });

  return { kpis, range, previousRange };
}

export async function getTrafficChannels(
  propertyId: string,
  range: DateRange,
  options?: { bypassCache?: boolean },
) {
  return runAnalyticsReport({
    propertyId,
    startDate: range.startDate,
    endDate: range.endDate,
    dimensions: ["sessionDefaultChannelGroup"],
    metrics: ["sessions", "totalUsers", "engagedSessions", "engagementRate"],
    limit: 20,
    orderBys: [{ metric: "sessions", desc: true }],
    bypassCache: options?.bypassCache,
  });
}

export async function getTopPages(
  propertyId: string,
  range: DateRange,
  options?: { bypassCache?: boolean },
) {
  return runAnalyticsReport({
    propertyId,
    startDate: range.startDate,
    endDate: range.endDate,
    dimensions: ["pageTitle", "pagePath"],
    metrics: ["screenPageViews", "totalUsers", "averageSessionDuration"],
    limit: 20,
    orderBys: [{ metric: "screenPageViews", desc: true }],
    bypassCache: options?.bypassCache,
  });
}

export async function getDeviceBreakdown(
  propertyId: string,
  range: DateRange,
  options?: { bypassCache?: boolean },
) {
  return runAnalyticsReport({
    propertyId,
    startDate: range.startDate,
    endDate: range.endDate,
    dimensions: ["deviceCategory"],
    metrics: ["totalUsers", "sessions"],
    limit: 10,
    orderBys: [{ metric: "totalUsers", desc: true }],
    bypassCache: options?.bypassCache,
  });
}

export async function getLocationBreakdown(
  propertyId: string,
  range: DateRange,
  options?: { bypassCache?: boolean },
) {
  return runAnalyticsReport({
    propertyId,
    startDate: range.startDate,
    endDate: range.endDate,
    dimensions: ["country", "city"],
    metrics: ["totalUsers", "sessions"],
    limit: 20,
    orderBys: [{ metric: "totalUsers", desc: true }],
    bypassCache: options?.bypassCache,
  });
}

export async function getTechnologyBreakdown(
  propertyId: string,
  range: DateRange,
  options?: { bypassCache?: boolean },
) {
  return runAnalyticsReport({
    propertyId,
    startDate: range.startDate,
    endDate: range.endDate,
    dimensions: ["deviceCategory", "browser", "operatingSystem"],
    metrics: ["totalUsers"],
    limit: 20,
    orderBys: [{ metric: "totalUsers", desc: true }],
    bypassCache: options?.bypassCache,
  });
}

export async function getNewVsReturningUsers(
  propertyId: string,
  range: DateRange,
  options?: { bypassCache?: boolean },
) {
  return runAnalyticsReport({
    propertyId,
    startDate: range.startDate,
    endDate: range.endDate,
    metrics: ["newUsers", "totalUsers"],
    bypassCache: options?.bypassCache,
  });
}

export async function getDailyTrafficTrend(
  propertyId: string,
  range: DateRange,
  metric: "totalUsers" | "sessions" | "screenPageViews" = "sessions",
  options?: { bypassCache?: boolean },
) {
  assertAllowedMetrics([metric]);
  return runAnalyticsReport({
    propertyId,
    startDate: range.startDate,
    endDate: range.endDate,
    dimensions: ["date"],
    metrics: [metric],
    limit: 100,
    orderBys: [{ dimension: "date", desc: false }],
    bypassCache: options?.bypassCache,
  });
}

export async function compareAnalyticsPeriods(
  propertyId: string,
  range: DateRange,
  options?: { bypassCache?: boolean },
) {
  const overview = await getOverviewMetrics(propertyId, range, options);
  return overview;
}

export async function testAnalyticsPropertyConnection(propertyId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const result = await runAnalyticsReport({
    propertyId,
    startDate: today,
    endDate: today,
    metrics: ["sessions"],
    bypassCache: true,
  });
  return {
    ok: true,
    rowCount: result.rowCount,
    message: "Connection successful.",
  };
}

export function employeeSafeErrorMessage(error: unknown): string {
  if (error instanceof AnalyticsConfigError || error instanceof AnalyticsAccessError) {
    // Keep employee message generic; detailed text is for admin logs/UI
    console.error("[analytics]", error.message);
  } else {
    console.error("[analytics]", error);
  }
  return "Analytics data is temporarily unavailable. Please try again shortly.";
}

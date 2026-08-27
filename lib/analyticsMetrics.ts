/** Friendly UI metrics → GA4 Data API metric names (allowlist only). */

export type AnalyticsMetricOption = {
  label: string;
  value: string;
  format?: "number" | "percent" | "duration";
};

export const ANALYTICS_METRICS: AnalyticsMetricOption[] = [
  { label: "Active Users", value: "activeUsers" },
  { label: "Total Users", value: "totalUsers" },
  { label: "New Users", value: "newUsers" },
  { label: "Sessions", value: "sessions" },
  { label: "Engaged Sessions", value: "engagedSessions" },
  {
    label: "Engagement Rate",
    value: "engagementRate",
    format: "percent",
  },
  {
    label: "Average Engagement Time",
    value: "averageSessionDuration",
    format: "duration",
  },
  { label: "Views", value: "screenPageViews" },
  { label: "Event Count", value: "eventCount" },
  { label: "Key Events", value: "keyEvents" },
  { label: "Screen / Page Views", value: "screenPageViews" },
  { label: "Sessions Per User", value: "sessionsPerUser" },
];

export const ANALYTICS_METRIC_MAP = Object.fromEntries(
  ANALYTICS_METRICS.map((m) => [m.value, m]),
) as Record<string, AnalyticsMetricOption>;

export const DEFAULT_OVERVIEW_METRICS = [
  "totalUsers",
  "sessions",
  "screenPageViews",
  "engagementRate",
  "averageSessionDuration",
  "newUsers",
] as const;

export function assertAllowedMetrics(metrics: string[]): string[] {
  const allowed = new Set(ANALYTICS_METRICS.map((m) => m.value));
  const unique = [...new Set(metrics)];
  for (const metric of unique) {
    if (!allowed.has(metric)) {
      throw new Error(`Unsupported metric: ${metric}`);
    }
  }
  return unique;
}

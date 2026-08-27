/** Friendly UI dimensions → GA4 Data API dimension names (allowlist only). */

export type AnalyticsDimensionOption = {
  label: string;
  value: string;
};

export const ANALYTICS_DIMENSIONS: AnalyticsDimensionOption[] = [
  { label: "Date", value: "date" },
  { label: "Default Channel Group", value: "sessionDefaultChannelGroup" },
  { label: "Session Source", value: "sessionSource" },
  { label: "Session Medium", value: "sessionMedium" },
  { label: "Source / Medium", value: "sessionSourceMedium" },
  { label: "Page Path", value: "pagePath" },
  { label: "Page Title", value: "pageTitle" },
  { label: "Country", value: "country" },
  { label: "City", value: "city" },
  { label: "Device Category", value: "deviceCategory" },
  { label: "Browser", value: "browser" },
  { label: "Operating System", value: "operatingSystem" },
];

export const ANALYTICS_DIMENSION_MAP = Object.fromEntries(
  ANALYTICS_DIMENSIONS.map((d) => [d.value, d]),
) as Record<string, AnalyticsDimensionOption>;

export function assertAllowedDimensions(dimensions: string[]): string[] {
  const allowed = new Set(ANALYTICS_DIMENSIONS.map((d) => d.value));
  const unique = [...new Set(dimensions)];
  for (const dimension of unique) {
    if (!allowed.has(dimension)) {
      throw new Error(`Unsupported dimension: ${dimension}`);
    }
  }
  return unique;
}

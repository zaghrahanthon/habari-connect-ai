import { prisma } from "@/lib/prisma";
import {
  getOverviewMetrics,
  getTrafficChannels,
  getTopPages,
  getDeviceBreakdown,
  getLocationBreakdown,
  employeeSafeErrorMessage,
} from "@/lib/googleAnalyticsReports";
import { resolveDatePreset, type DatePreset } from "@/lib/analyticsDates";
import { AnalyticsConfigError } from "@/lib/googleAnalyticsClient";

const ANALYTICS_QUESTION_RE =
  /\b(analytics|traffic|sessions?|page ?views?|users?|engagement|channel|organic|device|mobile|desktop|ga4|google analytics|website performance|top pages?|bounce|conversion)\b/i;

const BRAND_HINT_RE =
  /\b(joburg etc|cape town etc|bona|getaway|carmag|sa rugby|african insider)\b/i;

export function isAnalyticsQuestion(query: string): boolean {
  return ANALYTICS_QUESTION_RE.test(query) || BRAND_HINT_RE.test(query);
}

export type AnalyticsIntent =
  | "overview"
  | "traffic"
  | "content"
  | "devices"
  | "locations"
  | "summary";

export function determineAnalyticsIntent(query: string): AnalyticsIntent {
  const q = query.toLowerCase();
  if (/\b(top pages?|content|page path|page title)\b/.test(q)) return "content";
  if (/\b(channel|source|organic|referral|social|email|paid)\b/.test(q))
    return "traffic";
  if (/\b(device|mobile|desktop|tablet)\b/.test(q)) return "devices";
  if (/\b(country|city|location|audience|geo)\b/.test(q)) return "locations";
  if (/\b(summar|executive|insight|recommend)\b/.test(q)) return "summary";
  return "overview";
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n) >= 1000) return Math.round(n).toLocaleString("en-ZA");
  if (n < 1 && n > 0) return (n * 100).toFixed(1) + "%";
  return String(Math.round(n * 100) / 100);
}

export function formatAnalyticsForAi(payload: {
  propertyName: string;
  brand?: string | null;
  rangeLabel: string;
  data: unknown;
}): string {
  return [
    "## Google Analytics data (authoritative — do not invent values)",
    `Property: ${payload.propertyName}`,
    payload.brand ? `Brand: ${payload.brand}` : null,
    `Date range: ${payload.rangeLabel}`,
    "",
    "Analyse ONLY the JSON data below. Never invent traffic, users, engagement, page views, or conversions.",
    "Clearly distinguish facts from interpretation.",
    "If a requested detail is missing, say it is not available in the current report.",
    "",
    "```json",
    JSON.stringify(payload.data, null, 2),
    "```",
  ]
    .filter(Boolean)
    .join("\n");
}

async function findPropertyForQuestion(question: string) {
  const properties = await prisma.analyticsProperty.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  if (properties.length === 0) return null;

  const q = question.toLowerCase();
  const matched = properties.find((p) => {
    const hay = `${p.name} ${p.brand ?? ""}`.toLowerCase();
    return hay.split(/\s+/).some((token) => token.length > 2 && q.includes(token));
  });
  return matched ?? properties[0];
}

export async function getAnalyticsContextForChat(question: string): Promise<{
  relevant: boolean;
  context: string;
}> {
  if (!isAnalyticsQuestion(question)) {
    return { relevant: false, context: "" };
  }

  try {
    const property = await findPropertyForQuestion(question);
    if (!property) {
      return {
        relevant: true,
        context: [
          "## Google Analytics",
          "No active analytics properties are configured yet. Ask an admin to add a GA4 property in Admin → Analytics.",
        ].join("\n"),
      };
    }

    const intent = determineAnalyticsIntent(question);
    const preset: DatePreset = /\blast month\b/i.test(question)
      ? "lastMonth"
      : /\blast 7\b/i.test(question)
        ? "last7"
        : "last30";
    const range = resolveDatePreset(preset);

    let data: unknown;
    switch (intent) {
      case "traffic":
        data = {
          channels: (await getTrafficChannels(property.propertyId, range)).rows.slice(0, 10),
        };
        break;
      case "content":
        data = {
          topPages: (await getTopPages(property.propertyId, range)).rows.slice(0, 10),
        };
        break;
      case "devices":
        data = {
          devices: (await getDeviceBreakdown(property.propertyId, range)).rows,
        };
        break;
      case "locations":
        data = {
          locations: (await getLocationBreakdown(property.propertyId, range)).rows.slice(0, 10),
        };
        break;
      case "summary":
      case "overview":
      default: {
        const overview = await getOverviewMetrics(property.propertyId, range);
        data = {
          kpis: overview.kpis.map((k) => ({
            label: k.label,
            value: formatNumber(k.value),
            previous: k.previous == null ? null : formatNumber(k.previous),
            changePercent:
              k.changePercent == null
                ? null
                : `${k.changePercent.toFixed(1)}%`,
          })),
          previousRange: overview.previousRange,
        };
        break;
      }
    }

    return {
      relevant: true,
      context: formatAnalyticsForAi({
        propertyName: property.name,
        brand: property.brand,
        rangeLabel: `${range.startDate} to ${range.endDate}`,
        data,
      }),
    };
  } catch (error) {
    if (error instanceof AnalyticsConfigError) {
      return {
        relevant: true,
        context: [
          "## Google Analytics",
          "Analytics credentials are not configured. An admin must set service-account environment variables.",
        ].join("\n"),
      };
    }
    console.error("Analytics chat context failed:", employeeSafeErrorMessage(error));
    return {
      relevant: true,
      context: [
        "## Google Analytics",
        "Analytics data is temporarily unavailable. Do not invent website performance numbers.",
      ].join("\n"),
    };
  }
}

import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";

export type DatePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "last3Months"
  | "custom";

export type DateRange = {
  startDate: string; // yyyy-MM-dd
  endDate: string;
};

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "last3Months", label: "Last 3 Months" },
  { value: "custom", label: "Custom Range" },
];

function toYmd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function resolveDatePreset(
  preset: DatePreset,
  custom?: Partial<DateRange>,
  now = new Date(),
): DateRange {
  switch (preset) {
    case "today":
      return { startDate: toYmd(now), endDate: toYmd(now) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { startDate: toYmd(y), endDate: toYmd(y) };
    }
    case "last7":
      return { startDate: toYmd(subDays(now, 6)), endDate: toYmd(now) };
    case "last30":
      return { startDate: toYmd(subDays(now, 29)), endDate: toYmd(now) };
    case "thisMonth":
      return { startDate: toYmd(startOfMonth(now)), endDate: toYmd(now) };
    case "lastMonth": {
      const prev = subMonths(now, 1);
      return {
        startDate: toYmd(startOfMonth(prev)),
        endDate: toYmd(endOfMonth(prev)),
      };
    }
    case "last3Months":
      return {
        startDate: toYmd(startOfMonth(subMonths(now, 2))),
        endDate: toYmd(now),
      };
    case "custom": {
      if (!custom?.startDate || !custom?.endDate) {
        throw new Error("Custom date range requires startDate and endDate.");
      }
      return validateDateRange(custom.startDate, custom.endDate);
    }
    default:
      return { startDate: toYmd(subDays(now, 29)), endDate: toYmd(now) };
  }
}

export function validateDateRange(startDate: string, endDate: string): DateRange {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date range.");
  }
  if (start > end) {
    throw new Error("Start date must be on or before end date.");
  }
  const days = differenceInCalendarDays(end, start) + 1;
  if (days > 366) {
    throw new Error("Date range cannot exceed 366 days.");
  }
  return { startDate: toYmd(start), endDate: toYmd(end) };
}

/** Previous period of equal length immediately before the current range. */
export function getPreviousPeriod(range: DateRange): DateRange {
  const start = parseISO(range.startDate);
  const end = parseISO(range.endDate);
  const days = differenceInCalendarDays(end, start) + 1;
  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, days - 1);
  return { startDate: toYmd(prevStart), endDate: toYmd(prevEnd) };
}

export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) {
    if (current === 0) return 0;
    return null; // avoid divide-by-zero → show absolute only
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function formatPercentChange(value: number | null): string {
  if (value === null) return "n/a vs previous period";
  const sign = value > 0 ? "↑" : value < 0 ? "↓" : "→";
  return `${sign} ${Math.abs(value).toFixed(1)}% vs previous period`;
}

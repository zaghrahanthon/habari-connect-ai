import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parse,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export const COMPANY_TIMEZONE = "Africa/Johannesburg";

const DATE_FORMATS = [
  "yyyy-MM-dd",
  "dd/MM/yyyy",
  "dd-MM-yyyy",
  "d/M/yyyy",
  "d-M-yyyy",
  "dd/MM/yy",
  "d/M/yy",
  "yyyy/MM/dd",
];

/** Normalise a value that may be a Sheets serial, Date, or string into YYYY-MM-DD in SA timezone. */
export function parseSheetDate(value: unknown): string | null {
  if (value == null || value === "") return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    return googleSerialToDateString(value);
  }

  if (value instanceof Date && isValid(value)) {
    return formatInTimeZone(value, COMPANY_TIMEZONE, "yyyy-MM-dd");
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // ISO date or datetime
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const iso = parseISO(raw.includes("T") ? raw : `${raw}T12:00:00`);
    if (isValid(iso)) {
      return formatInTimeZone(iso, COMPANY_TIMEZONE, "yyyy-MM-dd");
    }
  }

  // Prefer SA DD/MM/YYYY when ambiguous (e.g. 03/04/2026)
  for (const fmt of DATE_FORMATS) {
    const parsed = parse(raw, fmt, new Date());
    if (isValid(parsed)) {
      // Interpret calendar date in Johannesburg without UTC day-shift
      const asNoonUtc = fromZonedTime(
        `${format(parsed, "yyyy-MM-dd")}T12:00:00`,
        COMPANY_TIMEZONE,
      );
      return formatInTimeZone(asNoonUtc, COMPANY_TIMEZONE, "yyyy-MM-dd");
    }
  }

  const fallback = new Date(raw);
  if (isValid(fallback)) {
    return formatInTimeZone(fallback, COMPANY_TIMEZONE, "yyyy-MM-dd");
  }

  return null;
}

/** Google Sheets serial date (days since 1899-12-30). */
export function googleSerialToDateString(serial: number): string | null {
  if (!Number.isFinite(serial)) return null;
  // Sheets serial epoch is 1899-12-30
  const utcMs = Date.UTC(1899, 11, 30) + serial * 86400000;
  const date = new Date(utcMs);
  if (!isValid(date)) return null;
  return formatInTimeZone(date, "UTC", "yyyy-MM-dd");
}

export function parseSheetTime(value: unknown): string | null {
  if (value == null || value === "") return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    const fraction = value % 1;
    const totalMinutes = Math.round(fraction * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;

  const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[4]?.toLowerCase();

  if (minutes > 59) return null;

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (!meridiem && hours > 23) return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function nowInCompanyTz(): Date {
  return toZonedTime(new Date(), COMPANY_TIMEZONE);
}

export function todayDateString(): string {
  return formatInTimeZone(new Date(), COMPANY_TIMEZONE, "yyyy-MM-dd");
}

export function formatDisplayDate(dateStr: string): string {
  const d = parseISO(`${dateStr}T12:00:00`);
  if (!isValid(d)) return dateStr;
  return format(d, "EEE, d MMM yyyy");
}

export function formatDisplayTime(time: string | null, allDay: boolean): string | null {
  if (allDay || !time) return allDay ? "All day" : null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const date = new Date(2000, 0, 1, h, m);
  return format(date, "h:mm a");
}

export function getWeekRange(anchor = todayDateString()): { start: string; end: string } {
  const d = parseISO(`${anchor}T12:00:00`);
  const start = startOfWeek(d, { weekStartsOn: 1 });
  const end = endOfWeek(d, { weekStartsOn: 1 });
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

export function getMonthRange(anchor = todayDateString()): { start: string; end: string } {
  const d = parseISO(`${anchor}T12:00:00`);
  return {
    start: format(startOfMonth(d), "yyyy-MM-dd"),
    end: format(endOfMonth(d), "yyyy-MM-dd"),
  };
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const d = parseISO(`${dateStr}T12:00:00`);
  return format(addDays(d, days), "yyyy-MM-dd");
}

export function compareEventsByStart(
  a: { startDate: string; startTime: string | null },
  b: { startDate: string; startTime: string | null },
): number {
  if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
  return (a.startTime ?? "00:00").localeCompare(b.startTime ?? "00:00");
}

export function isDateInRange(
  dateStr: string,
  start: string,
  end: string,
): boolean {
  return dateStr >= start && dateStr <= end;
}

export function eventSortKey(event: {
  startDate: string;
  startTime: string | null;
}): number {
  const time = event.startTime ?? "00:00";
  const d = fromZonedTime(`${event.startDate}T${time}:00`, COMPANY_TIMEZONE);
  return d.getTime();
}

export function startOfTodayCompany(): Date {
  return startOfDay(nowInCompanyTz());
}

export function endOfTodayCompany(): Date {
  return endOfDay(nowInCompanyTz());
}

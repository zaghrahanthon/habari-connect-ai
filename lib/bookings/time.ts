import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import {
  BOOKING_TIMEZONE,
  BUSINESS_HOURS,
  isAllowedDuration,
} from "@/lib/bookings/hours";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === m - 1 &&
    probe.getUTCDate() === d
  );
}

export function isValidTimeString(value: string): boolean {
  return TIME_RE.test(value);
}

/** Interpret a Johannesburg civil date+time as a UTC Date for storage. */
export function zonedDateTime(dateStr: string, timeStr: string): Date {
  return fromZonedTime(`${dateStr}T${timeStr}:00`, BOOKING_TIMEZONE);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function minutesOfDayInZone(date: Date): number {
  const zoned = toZonedTime(date, BOOKING_TIMEZONE);
  return zoned.getHours() * 60 + zoned.getMinutes();
}

export function weekdayInZone(date: Date): number {
  return toZonedTime(date, BOOKING_TIMEZONE).getDay();
}

export function formatDateLong(date: Date): string {
  return format(toZonedTime(date, BOOKING_TIMEZONE), "EEEE, d MMMM yyyy");
}

export function formatDateShort(date: Date): string {
  return format(toZonedTime(date, BOOKING_TIMEZONE), "d MMMM yyyy");
}

export function formatTime(date: Date): string {
  return format(toZonedTime(date, BOOKING_TIMEZONE), "HH:mm");
}

export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function toDateString(date: Date): string {
  return format(toZonedTime(date, BOOKING_TIMEZONE), "yyyy-MM-dd");
}

export function nowInBookingZone(): Date {
  return new Date();
}

export type BookingWindowIssue =
  | "invalid-range"
  | "invalid-duration"
  | "outside-business-hours"
  | "weekend"
  | "in-the-past";

export function validateBookingWindow(
  startTime: Date,
  endTime: Date,
  durationMinutes: number,
  now = nowInBookingZone(),
): BookingWindowIssue | null {
  if (!(startTime instanceof Date) || Number.isNaN(startTime.getTime())) {
    return "invalid-range";
  }
  if (!(endTime instanceof Date) || Number.isNaN(endTime.getTime())) {
    return "invalid-range";
  }
  if (endTime.getTime() <= startTime.getTime()) {
    return "invalid-range";
  }
  if (!isAllowedDuration(durationMinutes)) {
    return "invalid-duration";
  }
  const expectedEnd = addMinutes(startTime, durationMinutes);
  if (expectedEnd.getTime() !== endTime.getTime()) {
    return "invalid-duration";
  }
  if (!BUSINESS_HOURS.weekdays.includes(weekdayInZone(startTime) as 1 | 2 | 3 | 4 | 5)) {
    return "weekend";
  }
  if (weekdayInZone(endTime) !== weekdayInZone(startTime)) {
    return "outside-business-hours";
  }
  const startMins = minutesOfDayInZone(startTime);
  const endMins = minutesOfDayInZone(endTime);
  if (
    startMins < BUSINESS_HOURS.startMinutes ||
    endMins > BUSINESS_HOURS.endMinutes ||
    startMins >= BUSINESS_HOURS.endMinutes
  ) {
    return "outside-business-hours";
  }
  if (startTime.getTime() <= now.getTime()) {
    return "in-the-past";
  }
  return null;
}

export function windowIssueMessage(issue: BookingWindowIssue): string {
  switch (issue) {
    case "invalid-range":
      return "End time must be after start time.";
    case "invalid-duration":
      return "Please choose a valid duration.";
    case "outside-business-hours":
      return "Bookings are only available Monday–Friday, 08:00–17:00.";
    case "weekend":
      return "Boardrooms can only be booked on weekdays.";
    case "in-the-past":
      return "You cannot book a time that has already passed.";
  }
}

export function padTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function minutesToTime(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return padTime(hours, minutes);
}

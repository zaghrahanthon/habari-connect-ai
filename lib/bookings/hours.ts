/** Central boardroom booking rules — change hours here, not in UI/API. */

export const BOOKING_TIMEZONE = "Africa/Johannesburg";

export const BUSINESS_HOURS = {
  /** Inclusive start of the bookable day, minutes from midnight. */
  startMinutes: 8 * 60,
  /** Exclusive end of the bookable day, minutes from midnight. */
  endMinutes: 17 * 60,
  /** Monday–Friday (JS getDay: 0 Sunday). */
  weekdays: [1, 2, 3, 4, 5] as const,
  slotStepMinutes: 30,
} as const;

export const DURATION_OPTIONS_MINUTES = [30, 45, 60, 90, 120, 150, 180] as const;

export const DURATION_LABELS: Record<number, string> = {
  30: "30 minutes",
  45: "45 minutes",
  60: "1 hour",
  90: "1 hour 30 minutes",
  120: "2 hours",
  150: "2 hours 30 minutes",
  180: "3 hours",
};

export function formatDuration(minutes: number): string {
  return DURATION_LABELS[minutes] ?? `${minutes} minutes`;
}

export function isAllowedDuration(minutes: number): boolean {
  return (DURATION_OPTIONS_MINUTES as readonly number[]).includes(minutes);
}

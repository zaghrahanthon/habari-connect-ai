/**
 * Pure overlap rules for boardroom bookings.
 * Existing.start < requested.end AND existing.end > requested.start
 * Adjacent bookings (10:00–11:00 then 11:00–12:00) are allowed.
 */

export type Interval = {
  startTime: Date;
  endTime: Date;
};

export function rangesOverlap(
  existingStart: Date,
  existingEnd: Date,
  requestedStart: Date,
  requestedEnd: Date,
): boolean {
  return existingStart < requestedEnd && existingEnd > requestedStart;
}

export function intervalOverlaps(
  existing: Interval,
  requested: Interval,
): boolean {
  return rangesOverlap(
    existing.startTime,
    existing.endTime,
    requested.startTime,
    requested.endTime,
  );
}

export function findOverlappingBooking<T extends Interval>(
  existing: T[],
  requested: Interval,
): T | undefined {
  return existing.find((booking) => intervalOverlaps(booking, requested));
}

import { rangesOverlap } from "@/lib/bookings/conflicts";
import { BUSINESS_HOURS } from "@/lib/bookings/hours";
import {
  addMinutes,
  minutesToTime,
  nowInBookingZone,
  zonedDateTime,
} from "@/lib/bookings/time";

export type OccupiedInterval = {
  startTime: Date;
  endTime: Date;
};

export type AvailabilitySlot = {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: "booked" | "past";
};

export function buildDaySlots(
  dateStr: string,
  durationMinutes: number,
  occupied: OccupiedInterval[],
  now = nowInBookingZone(),
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const lastStart =
    BUSINESS_HOURS.endMinutes - durationMinutes;

  for (
    let minutes = BUSINESS_HOURS.startMinutes;
    minutes <= lastStart;
    minutes += BUSINESS_HOURS.slotStepMinutes
  ) {
    const startLabel = minutesToTime(minutes);
    const start = zonedDateTime(dateStr, startLabel);
    const end = addMinutes(start, durationMinutes);
    const endLabel = minutesToTime(minutes + durationMinutes);

    if (start.getTime() <= now.getTime()) {
      slots.push({
        startTime: startLabel,
        endTime: endLabel,
        available: false,
        reason: "past",
      });
      continue;
    }

    const booked = occupied.some((item) =>
      rangesOverlap(item.startTime, item.endTime, start, end),
    );

    slots.push({
      startTime: startLabel,
      endTime: endLabel,
      available: !booked,
      reason: booked ? "booked" : undefined,
    });
  }

  return slots;
}

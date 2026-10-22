import { NextResponse } from "next/server";
import { requireBookingSession } from "@/lib/bookings/access";
import { getActiveRoomById } from "@/lib/bookings/service";
import { prisma } from "@/lib/prisma";
import { buildDaySlots } from "@/lib/bookings/slots";
import { isAllowedDuration } from "@/lib/bookings/hours";
import {
  addMinutes,
  isValidDateString,
  isValidTimeString,
  zonedDateTime,
  weekdayInZone,
} from "@/lib/bookings/time";
import { BUSINESS_HOURS } from "@/lib/bookings/hours";
import { findOverlappingBooking } from "@/lib/bookings/conflicts";
import { formatTimeRange } from "@/lib/bookings/time";
import { handleApiError } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { error } = await requireBookingSession("/api/bookings/availability");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId") ?? "";
    const date = searchParams.get("date") ?? "";
    const durationMinutes = Number(searchParams.get("durationMinutes") ?? "60");
    const startTime = searchParams.get("startTime");
    const excludeId = searchParams.get("excludeId") ?? undefined;

    if (!roomId) {
      return NextResponse.json({ error: "Please choose a meeting room." }, { status: 400 });
    }
    if (!isValidDateString(date)) {
      return NextResponse.json({ error: "Please choose a valid date." }, { status: 400 });
    }
    if (!isAllowedDuration(durationMinutes)) {
      return NextResponse.json({ error: "Please choose a valid duration." }, { status: 400 });
    }

    const room = await getActiveRoomById(roomId);
    if (!room) {
      return NextResponse.json({ error: "That meeting room is not available." }, { status: 404 });
    }

    const dayStart = zonedDateTime(date, "00:00");
    const dayEnd = addMinutes(dayStart, 24 * 60);
    const weekday = weekdayInZone(dayStart);
    if (!(BUSINESS_HOURS.weekdays as readonly number[]).includes(weekday)) {
      return NextResponse.json({
        roomId: room.id,
        roomName: room.name,
        date,
        durationMinutes,
        weekend: true,
        slots: [],
        available: false,
        message: "Boardrooms can only be booked on weekdays.",
      });
    }

    const occupied = await prisma.roomBooking.findMany({
      where: {
        roomId: room.id,
        status: "CONFIRMED",
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { startTime: true, endTime: true },
      orderBy: { startTime: "asc" },
    });

    const slots = buildDaySlots(date, durationMinutes, occupied);

    let requested:
      | {
          available: boolean;
          message: string;
          conflictRange?: string;
        }
      | undefined;

    if (startTime && isValidTimeString(startTime)) {
      const start = zonedDateTime(date, startTime);
      const end = addMinutes(start, durationMinutes);
      const conflict = findOverlappingBooking(occupied, {
        startTime: start,
        endTime: end,
      });
      if (conflict) {
        requested = {
          available: false,
          message: `Unavailable — this room is already booked between ${formatTimeRange(conflict.startTime, conflict.endTime)}.`,
          conflictRange: formatTimeRange(conflict.startTime, conflict.endTime),
        };
      } else {
        const matching = slots.find((slot) => slot.startTime === startTime);
        if (matching?.reason === "past") {
          requested = {
            available: false,
            message: "You cannot book a time that has already passed.",
          };
        } else if (matching && !matching.available) {
          requested = {
            available: false,
            message: `${room.name} is already booked during this time. Please choose another time.`,
          };
        } else if (!matching) {
          requested = {
            available: false,
            message: "That time is outside business hours for the selected duration.",
          };
        } else {
          requested = {
            available: true,
            message: "Available",
          };
        }
      }
    }

    return NextResponse.json({
      roomId: room.id,
      roomName: room.name,
      date,
      durationMinutes,
      slots,
      requested,
    });
  } catch (e) {
    return handleApiError(e, "Failed to check availability");
  }
}

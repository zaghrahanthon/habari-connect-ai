import { NextResponse } from "next/server";
import { requireBookingSession } from "@/lib/bookings/access";
import {
  BookingError,
  confirmedBookingsInRange,
  createRoomBooking,
} from "@/lib/bookings/service";
import { serializeBookings } from "@/lib/bookings/bookerProfile";
import type { BookingRecord } from "@/lib/bookings/serialize";
import { createBookingSchema } from "@/lib/validations/bookings";
import { handleApiError } from "@/lib/api-utils";
import { zonedDateTime, addMinutes } from "@/lib/bookings/time";

export async function GET(request: Request) {
  const { error } = await requireBookingSession("/api/bookings");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const roomId = searchParams.get("roomId") ?? undefined;
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: "start and end query parameters are required." },
        { status: 400 },
      );
    }

    const start = new Date(startParam);
    const end = new Date(endParam);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
    }
    if (end <= start) {
      return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
    }

    const maxRangeMs = 1000 * 60 * 60 * 24 * 62;
    if (end.getTime() - start.getTime() > maxRangeMs) {
      return NextResponse.json(
        { error: "Please request a smaller date range." },
        { status: 400 },
      );
    }

    const bookings = await confirmedBookingsInRange({ start, end, roomId });
    const serialized = (await serializeBookings(bookings as BookingRecord[])).filter(
      (booking) => {
        if (!q) return true;
        return (
          booking.title.toLowerCase().includes(q) ||
          booking.bookedBy.name.toLowerCase().includes(q) ||
          booking.roomName.toLowerCase().includes(q)
        );
      });

    return NextResponse.json({ bookings: serialized });
  } catch (e) {
    return handleApiError(e, "Failed to load bookings");
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireBookingSession("/api/bookings");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createBookingSchema.parse(body);
    const booking = await createRoomBooking({
      userId: session!.user.id,
      roomId: data.roomId,
      title: data.title,
      description: data.description,
      date: data.date,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
    });

    return NextResponse.json(
      {
        booking,
        message: `${booking.roomName} booked successfully`,
      },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof BookingError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return handleApiError(e, "Failed to create booking");
  }
}

void zonedDateTime;
void addMinutes;

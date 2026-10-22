import { NextResponse } from "next/server";
import { requireBookingSession } from "@/lib/bookings/access";
import {
  BookingError,
  bookingInclude,
  rescheduleRoomBooking,
} from "@/lib/bookings/service";
import { prisma } from "@/lib/prisma";
import { findBookerProfile } from "@/lib/bookings/bookerProfile";
import { serializeBooking, type BookingRecord } from "@/lib/bookings/serialize";
import { rescheduleBookingSchema } from "@/lib/validations/bookings";
import { handleApiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireBookingSession("/api/bookings/[id]");
  if (error) return error;

  try {
    const { id } = await context.params;
    const booking = await prisma.roomBooking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const isOwner = booking.userId === session!.user.id;
    const isAdmin = session!.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      booking: serializeBooking(
        booking as BookingRecord,
        await findBookerProfile((booking as BookingRecord).user),
      ),
    });
  } catch (e) {
    return handleApiError(e, "Failed to load booking");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireBookingSession("/api/bookings/[id]");
  if (error) return error;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const data = rescheduleBookingSchema.parse(body);
    const booking = await rescheduleRoomBooking({
      bookingId: id,
      actorId: session!.user.id,
      actorRole: session!.user.role,
      date: data.date,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
      title: data.title,
      description: data.description,
      roomId: data.roomId,
    });

    return NextResponse.json({
      booking,
      message: `${booking.roomName} updated successfully`,
    });
  } catch (e) {
    if (e instanceof BookingError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return handleApiError(e, "Failed to update booking");
  }
}

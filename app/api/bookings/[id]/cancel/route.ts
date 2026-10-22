import { NextResponse } from "next/server";
import { requireBookingSession } from "@/lib/bookings/access";
import { prisma } from "@/lib/prisma";
import { bookingInclude } from "@/lib/bookings/service";
import { canCancelBooking } from "@/lib/bookings/permissions";
import { findBookerProfile } from "@/lib/bookings/bookerProfile";
import { serializeBooking, type BookingRecord } from "@/lib/bookings/serialize";
import { handleApiError } from "@/lib/api-utils";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireBookingSession(
    "/api/bookings/[id]/cancel",
  );
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

    const permission = canCancelBooking(
      { id: session!.user.id, role: session!.user.role },
      booking,
    );
    if (!permission.ok) {
      return NextResponse.json(
        { error: permission.reason },
        { status: permission.reason.includes("only cancel your own") ? 403 : 400 },
      );
    }

    const updated = await prisma.roomBooking.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: bookingInclude,
    });

    return NextResponse.json({
      booking: serializeBooking(
        updated as BookingRecord,
        await findBookerProfile((updated as BookingRecord).user),
      ),
      message: "Booking cancelled",
    });
  } catch (e) {
    return handleApiError(e, "Failed to cancel booking");
  }
}

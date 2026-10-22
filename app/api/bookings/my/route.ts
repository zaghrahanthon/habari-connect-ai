import { NextResponse } from "next/server";
import { requireBookingSession } from "@/lib/bookings/access";
import { prisma } from "@/lib/prisma";
import { bookingInclude } from "@/lib/bookings/service";
import { serializeBookings } from "@/lib/bookings/bookerProfile";
import type { BookingRecord } from "@/lib/bookings/serialize";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  const { session, error } = await requireBookingSession("/api/bookings/my");
  if (error) return error;

  try {
    const now = new Date();
    const bookings = await prisma.roomBooking.findMany({
      where: { userId: session!.user.id },
      include: bookingInclude,
      orderBy: { startTime: "desc" },
    });

    const serialized = await serializeBookings(bookings as BookingRecord[]);

    return NextResponse.json({
      upcoming: serialized.filter(
        (b) => b.status === "CONFIRMED" && new Date(b.startTime) > now,
      ),
      previous: serialized.filter(
        (b) => b.status === "CONFIRMED" && new Date(b.startTime) <= now,
      ),
      cancelled: serialized.filter((b) => b.status === "CANCELLED"),
    });
  } catch (e) {
    return handleApiError(e, "Failed to load your bookings");
  }
}

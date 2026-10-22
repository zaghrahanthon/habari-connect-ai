import { NextResponse } from "next/server";
import { requireBookingSession } from "@/lib/bookings/access";
import { getActiveRooms } from "@/lib/bookings/service";
import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/bookings/time";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  const { error } = await requireBookingSession("/api/bookings/status");
  if (error) return error;

  try {
    const now = new Date();
    const rooms = await getActiveRooms();
    const upcoming = await prisma.roomBooking.findMany({
      where: {
        status: "CONFIRMED",
        endTime: { gt: now },
        roomId: { in: rooms.map((room) => room.id) },
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        roomId: true,
        title: true,
        startTime: true,
        endTime: true,
      },
    });

    const cards = rooms.map((room) => {
      const roomBookings = upcoming.filter((b) => b.roomId === room.id);
      const current = roomBookings.find(
        (b) => b.startTime <= now && b.endTime > now,
      );
      const next =
        roomBookings.find((b) => b.startTime > now) ?? null;

      return {
        id: room.id,
        name: room.name,
        description: room.description,
        location: room.location,
        capacity: room.capacity,
        inUse: Boolean(current),
        currentTitle: current?.title ?? null,
        nextBooking: next
          ? {
              id: next.id,
              title: next.title,
              startTime: next.startTime.toISOString(),
              displayTime: formatTime(next.startTime),
            }
          : null,
      };
    });

    return NextResponse.json({ rooms: cards });
  } catch (e) {
    return handleApiError(e, "Failed to load room status");
  }
}

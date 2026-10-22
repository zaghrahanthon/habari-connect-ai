import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { findOverlappingBooking } from "@/lib/bookings/conflicts";
import {
  addMinutes,
  validateBookingWindow,
  windowIssueMessage,
  zonedDateTime,
} from "@/lib/bookings/time";
import { isAllowedDuration } from "@/lib/bookings/hours";
import { findBookerProfile } from "@/lib/bookings/bookerProfile";
import { serializeBooking, type BookingRecord } from "@/lib/bookings/serialize";

export const bookingInclude = {
  room: { select: { id: true, name: true } },
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.RoomBookingInclude;

export class BookingError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "BookingError";
    this.status = status;
  }
}

export async function getActiveRooms() {
  return prisma.meetingRoom.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getActiveRoomById(id: string) {
  return prisma.meetingRoom.findFirst({
    where: { id, isActive: true },
  });
}

export async function getActiveRoomByName(name: string) {
  return prisma.meetingRoom.findFirst({
    where: {
      isActive: true,
      name: { equals: name.trim(), mode: "insensitive" },
    },
  });
}

export async function confirmedBookingsInRange(params: {
  start: Date;
  end: Date;
  roomId?: string;
}) {
  return prisma.roomBooking.findMany({
    where: {
      status: "CONFIRMED",
      startTime: { lt: params.end },
      endTime: { gt: params.start },
      ...(params.roomId ? { roomId: params.roomId } : {}),
    },
    include: bookingInclude,
    orderBy: { startTime: "asc" },
  });
}

export async function createRoomBooking(input: {
  userId: string;
  roomId: string;
  title: string;
  description?: string | null;
  date: string;
  startTime: string;
  durationMinutes: number;
}) {
  const title = input.title.trim();
  if (!title) {
    throw new BookingError("Meeting title is required.");
  }
  if (!isAllowedDuration(input.durationMinutes)) {
    throw new BookingError("Please choose a valid duration.");
  }

  const room = await getActiveRoomById(input.roomId);
  if (!room) {
    throw new BookingError("That meeting room is not available.", 404);
  }

  const startTime = zonedDateTime(input.date, input.startTime);
  const endTime = addMinutes(startTime, input.durationMinutes);
  const windowIssue = validateBookingWindow(
    startTime,
    endTime,
    input.durationMinutes,
  );
  if (windowIssue) {
    throw new BookingError(windowIssueMessage(windowIssue));
  }

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.roomBooking.findMany({
          where: {
            roomId: room.id,
            status: "CONFIRMED",
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
          select: { startTime: true, endTime: true },
        });

        const conflict = findOverlappingBooking(existing, {
          startTime,
          endTime,
        });
        if (conflict) {
          throw new BookingError(
            `${room.name} is already booked during this time. Please choose another time.`,
            409,
          );
        }

        return tx.roomBooking.create({
          data: {
            roomId: room.id,
            userId: input.userId,
            title,
            description: input.description?.trim() || null,
            startTime,
            endTime,
            durationMinutes: input.durationMinutes,
            status: "CONFIRMED",
          },
          include: bookingInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return serializeBooking(
      created as BookingRecord,
      await findBookerProfile((created as BookingRecord).user),
    );
  } catch (error) {
    if (error instanceof BookingError) throw error;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      throw new BookingError(
        `${room.name} is already booked during this time. Please choose another time.`,
        409,
      );
    }
    const message = error instanceof Error ? error.message : "";
    if (message.includes("RoomBooking_no_overlap") || message.includes("23P01")) {
      throw new BookingError(
        `${room.name} is already booked during this time. Please choose another time.`,
        409,
      );
    }
    throw error;
  }
}

export async function rescheduleRoomBooking(input: {
  bookingId: string;
  actorId: string;
  actorRole: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  title?: string;
  description?: string | null;
  roomId?: string;
}) {
  const existing = await prisma.roomBooking.findUnique({
    where: { id: input.bookingId },
    include: bookingInclude,
  });
  if (!existing) {
    throw new BookingError("Booking not found.", 404);
  }
  if (existing.status === "CANCELLED") {
    throw new BookingError("Cancelled bookings cannot be rescheduled.");
  }
  if (existing.startTime.getTime() <= Date.now()) {
    throw new BookingError("Past bookings cannot be rescheduled.");
  }
  if (existing.userId !== input.actorId && input.actorRole !== "admin") {
    throw new BookingError("You can only reschedule your own bookings.", 403);
  }

  const roomId = input.roomId ?? existing.roomId;
  const room = await getActiveRoomById(roomId);
  if (!room) {
    throw new BookingError("That meeting room is not available.", 404);
  }

  const startTime = zonedDateTime(input.date, input.startTime);
  const endTime = addMinutes(startTime, input.durationMinutes);
  const windowIssue = validateBookingWindow(
    startTime,
    endTime,
    input.durationMinutes,
  );
  if (windowIssue) {
    throw new BookingError(windowIssueMessage(windowIssue));
  }

  const title = (input.title ?? existing.title).trim();
  if (!title) {
    throw new BookingError("Meeting title is required.");
  }

  try {
    const updated = await prisma.$transaction(
      async (tx) => {
        const others = await tx.roomBooking.findMany({
          where: {
            roomId: room.id,
            status: "CONFIRMED",
            id: { not: existing.id },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
          select: { startTime: true, endTime: true },
        });
        const conflict = findOverlappingBooking(others, { startTime, endTime });
        if (conflict) {
          throw new BookingError(
            `${room.name} is already booked during this time. Please choose another time.`,
            409,
          );
        }

        return tx.roomBooking.update({
          where: { id: existing.id },
          data: {
            roomId: room.id,
            title,
            description:
              input.description === undefined
                ? existing.description
                : input.description?.trim() || null,
            startTime,
            endTime,
            durationMinutes: input.durationMinutes,
          },
          include: bookingInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return serializeBooking(
      updated as BookingRecord,
      await findBookerProfile((updated as BookingRecord).user),
    );
  } catch (error) {
    if (error instanceof BookingError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (message.includes("RoomBooking_no_overlap") || message.includes("23P01")) {
      throw new BookingError(
        `${room.name} is already booked during this time. Please choose another time.`,
        409,
      );
    }
    throw error;
  }
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BookingError,
  createRoomBooking,
  getActiveRoomByName,
  getActiveRooms,
} from "@/lib/bookings/service";
import { findOverlappingBooking } from "@/lib/bookings/conflicts";
import { buildDaySlots } from "@/lib/bookings/slots";
import { formatDuration } from "@/lib/bookings/hours";
import {
  addMinutes,
  formatDateLong,
  formatTimeRange,
  validateBookingWindow,
  windowIssueMessage,
  zonedDateTime,
} from "@/lib/bookings/time";
import {
  conversationText,
  isBoardroomQuery,
  parseBoardroomDraft,
  wantsBookingConfirm,
  type ChatMessage,
} from "@/lib/bookings/chatParse";

export type { ChatMessage, BoardroomDraft } from "@/lib/bookings/chatParse";
export { isBoardroomQuery, parseBoardroomDraft, wantsBookingConfirm };

const CHAT_BOOKING_EMAIL = "chat-bookings@habariconnect.internal";

async function ensureChatBookingUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;

  const existing = await prisma.user.findUnique({
    where: { email: CHAT_BOOKING_EMAIL },
  });
  if (existing) return existing.id;

  const created = await prisma.user.create({
    data: {
      email: CHAT_BOOKING_EMAIL,
      firstName: "Habari",
      lastName: "Connect",
      role: "employee",
      isActive: true,
    },
  });
  return created.id;
}

export async function getBoardroomContextForChat(
  query: string,
  messages: ChatMessage[],
): Promise<{ relevant: boolean; context: string; booked: boolean }> {
  if (!isBoardroomQuery(query) && !isBoardroomQuery(conversationText(messages))) {
    return { relevant: false, context: "", booked: false };
  }

  const rooms = await getActiveRooms();
  const draft = parseBoardroomDraft(messages);
  const missing: string[] = [];
  if (!draft.roomName) missing.push("which room (Boardroom 1 or Boardroom 2)");
  if (!draft.date) missing.push("the date (YYYY-MM-DD, today, tomorrow, or a weekday)");
  if (!draft.startTime) missing.push("the start time (e.g. 10:00)");
  if (!draft.durationMinutes) missing.push("how long (30 minutes to 3 hours)");

  const roomList = rooms.map((room) => `- ${room.name}`).join("\n");
  const lines = [
    "## Boardroom booking",
    "Habari Connect can book Boardroom 1 or Boardroom 2 in chat. Do not send the employee to a dashboard URL.",
    "Business hours: Monday–Friday, 08:00–17:00 (Africa/Johannesburg).",
    "Available rooms:",
    roomList || "- none configured",
    `Draft from this conversation: room=${draft.roomName ?? "unknown"}, date=${draft.date ?? "unknown"}, start=${draft.startTime ?? "unknown"}, duration=${draft.durationMinutes ? formatDuration(draft.durationMinutes) : "unknown"}, title=${draft.title ?? "Meeting"}`,
  ];

  if (missing.length > 0) {
    lines.push(
      `Missing details: ${missing.join("; ")}. Ask for these only. Do not invent a time.`,
    );
    return { relevant: true, context: lines.join("\n"), booked: false };
  }

  const room = await getActiveRoomByName(draft.roomName!);
  if (!room) {
    lines.push("That room was not found. Only Boardroom 1 and Boardroom 2 can be booked.");
    return { relevant: true, context: lines.join("\n"), booked: false };
  }

  const start = zonedDateTime(draft.date!, draft.startTime!);
  const end = addMinutes(start, draft.durationMinutes!);
  const windowIssue = validateBookingWindow(
    start,
    end,
    draft.durationMinutes!,
  );
  if (windowIssue) {
    lines.push(`This request is not valid: ${windowIssueMessage(windowIssue)}`);
    return { relevant: true, context: lines.join("\n"), booked: false };
  }

  const dayStart = zonedDateTime(draft.date!, "00:00");
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const occupied = await prisma.roomBooking.findMany({
    where: {
      roomId: room.id,
      status: "CONFIRMED",
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    select: { startTime: true, endTime: true },
  });

  const conflict = findOverlappingBooking(occupied, {
    startTime: start,
    endTime: end,
  });
  if (conflict) {
    const alternatives = buildDaySlots(
      draft.date!,
      draft.durationMinutes!,
      occupied,
    )
      .filter((slot) => slot.available)
      .slice(0, 6)
      .map((slot) => slot.startTime);
    lines.push(
      `UNAVAILABLE: ${room.name} is already booked between ${formatTimeRange(conflict.startTime, conflict.endTime)}.`,
    );
    lines.push(
      alternatives.length
        ? `Other available start times that day: ${alternatives.join(", ")}.`
        : "There are no other available start times that day for this duration.",
    );
    lines.push("Do not tell the employee the booking was made.");
    return { relevant: true, context: lines.join("\n"), booked: false };
  }

  const summary = `${room.name} on ${formatDateLong(start)} ${formatTimeRange(start, end)} (${formatDuration(draft.durationMinutes!)})`;
  lines.push(`AVAILABLE: ${summary}.`);

  if (!wantsBookingConfirm(query)) {
    lines.push(
      "Do not create the booking yet. Summarise the details and ask the employee to reply with exactly: confirm booking",
    );
    return { relevant: true, context: lines.join("\n"), booked: false };
  }

  try {
    const userId = await ensureChatBookingUserId();
    const booking = await createRoomBooking({
      userId,
      roomId: room.id,
      title: draft.title?.trim() || "Meeting",
      date: draft.date!,
      startTime: draft.startTime!,
      durationMinutes: draft.durationMinutes!,
    });
    lines.push(
      `SUCCESS: ${booking.roomName} is booked for ${booking.display.dateLong}, ${booking.display.timeRange} (${booking.durationLabel}). Title: ${booking.title}.`,
    );
    lines.push(
      "Tell the employee the booking is confirmed. Do not send them to a dashboard page.",
    );
    return { relevant: true, context: lines.join("\n"), booked: true };
  } catch (error) {
    const message =
      error instanceof BookingError
        ? error.message
        : "The booking could not be saved. Please try another time.";
    lines.push(`FAILED: ${message}`);
    lines.push("Do not claim the room was booked.");
    return { relevant: true, context: lines.join("\n"), booked: false };
  }
}

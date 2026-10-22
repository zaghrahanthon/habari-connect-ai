import { toBookedBy, type BookerProfileMatch } from "@/lib/bookings/booker";
import { formatDuration } from "@/lib/bookings/hours";
import {
  formatDateLong,
  formatDateShort,
  formatTime,
  formatTimeRange,
} from "@/lib/bookings/time";

export type BookingRecord = {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  status: "CONFIRMED" | "CANCELLED" | string;
  roomId: string;
  userId: string;
  room: { id: string; name: string };
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email?: string | null;
  };
};

export function serializeBooking(
  booking: BookingRecord,
  profile: BookerProfileMatch | null = null,
) {
  return {
    id: booking.id,
    title: booking.title,
    description: booking.description,
    roomId: booking.roomId,
    roomName: booking.room.name,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    durationMinutes: booking.durationMinutes,
    durationLabel: formatDuration(booking.durationMinutes),
    status: booking.status,
    bookedBy: toBookedBy(booking.user, profile),
    display: {
      dateLong: formatDateLong(booking.startTime),
      dateShort: formatDateShort(booking.startTime),
      timeRange: formatTimeRange(booking.startTime, booking.endTime),
      startTime: formatTime(booking.startTime),
      endTime: formatTime(booking.endTime),
    },
  };
}

export type SerializedBooking = ReturnType<typeof serializeBooking>;

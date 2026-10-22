import type { SerializedBooking } from "@/lib/bookings/serialize";

export type RoomOption = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
};

export type RoomStatusCard = RoomOption & {
  inUse: boolean;
  currentTitle: string | null;
  nextBooking: {
    id: string;
    title: string;
    startTime: string;
    displayTime: string;
  } | null;
};

export type AvailabilitySlot = {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: "booked" | "past";
};

export type CalendarView = "month" | "week" | "day";

export function roomTone(name: string) {
  const isSecond = /2$/.test(name.trim()) || name.toLowerCase().includes("boardroom 2");
  if (isSecond) {
    return {
      label: name,
      event:
        "border-sky-500/35 bg-sky-500/15 text-sky-100",
      dot: "bg-sky-400",
    };
  }
  return {
    label: name,
    event:
      "border-indigo-500/35 bg-indigo-500/15 text-indigo-100",
    dot: "bg-indigo-400",
  };
}

export function isUpcoming(booking: SerializedBooking, now = new Date()) {
  return (
    booking.status === "CONFIRMED" && new Date(booking.startTime) > now
  );
}

export function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseYmd(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

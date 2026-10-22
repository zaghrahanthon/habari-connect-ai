"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BookingCalendar from "@/components/bookings/BookingCalendar";
import BookingDetailModal from "@/components/bookings/BookingDetailModal";
import BookerIdentity from "@/components/bookings/BookerIdentity";
import BookingSignIn from "@/components/bookings/BookingSignIn";
import {
  roomTone,
  toYmd,
  type AvailabilitySlot,
  type CalendarView,
  type RoomOption,
  type RoomStatusCard,
} from "@/components/bookings/bookingUi";
import type { SerializedBooking } from "@/lib/bookings/serialize";
import {
  DURATION_OPTIONS_MINUTES,
  formatDuration,
} from "@/lib/bookings/hours";
import { cn } from "@/lib/utils";

type SessionUser = {
  id: string;
  name?: string | null;
  role: string;
};

function todayYmd() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
  }).format(new Date());
}

function addDaysYmd(ymd: string, days: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return toYmd(date);
}

export default function BookingWorkspace({
  isAdmin = false,
  myBookingsHref = "/dashboard/bookings/my",
}: {
  isAdmin?: boolean;
  myBookingsHref?: string;
}) {
  const [sessionUser, setSessionUser] = useState<SessionUser | null | undefined>(
    undefined,
  );
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [statusCards, setStatusCards] = useState<RoomStatusCard[]>([]);
  const [bookings, setBookings] = useState<SerializedBooking[]>([]);
  const [upcoming, setUpcoming] = useState<SerializedBooking[]>([]);
  const [roomFilter, setRoomFilter] = useState("all");
  const [view, setView] = useState<CalendarView>("week");
  const [cursor, setCursor] = useState(() => new Date());
  const [date, setDate] = useState(todayYmd);
  const [roomId, setRoomId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [availability, setAvailability] = useState<{
    available: boolean;
    message: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<SerializedBooking | null>(null);
  const [search, setSearch] = useState("");
  const bookingSectionRef = useRef<HTMLFormElement>(null);

  const scrollToBookingForm = () => {
    const el = bookingSectionRef.current;
    if (!el) return;
    const scroller = el.closest("main");
    if (scroller instanceof HTMLElement) {
      const offset =
        el.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop -
        16;
      scroller.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectRoomToBook = (id: string) => {
    setRoomId(id);
    setRoomFilter(id);
    setError("");
    requestAnimationFrame(scrollToBookingForm);
  };

  const loadSession = useCallback(async () => {
    const res = await fetch("/api/auth/session");
    const data = await res.json();
    setSessionUser(data?.user?.id ? data.user : null);
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const visibleRange = useMemo(() => {
    const start = new Date(cursor);
    const end = new Date(cursor);
    if (view === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 1);
    } else if (view === "week") {
      const day = start.getDay();
      start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 7);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 1);
    }
    return { start: start.toISOString(), end: end.toISOString() };
  }, [cursor, view]);

  const refresh = useCallback(async () => {
    if (!sessionUser) return;
    const params = new URLSearchParams({
      start: visibleRange.start,
      end: visibleRange.end,
    });
    if (roomFilter !== "all") params.set("roomId", roomFilter);
    if (isAdmin && search.trim()) params.set("q", search.trim());

    const [roomsRes, statusRes, bookingsRes, upcomingRes] = await Promise.all([
      fetch("/api/rooms"),
      fetch("/api/bookings/status"),
      fetch(`/api/bookings?${params}`),
      fetch(
        `/api/bookings?start=${encodeURIComponent(new Date().toISOString())}&end=${encodeURIComponent(addDaysYmd(todayYmd(), 30) + "T22:00:00.000Z")}`,
      ),
    ]);

    const roomsData = await roomsRes.json();
    const statusData = await statusRes.json();
    const bookingsData = await bookingsRes.json();
    const upcomingData = await upcomingRes.json();

    if (Array.isArray(roomsData)) {
      setRooms(roomsData);
      setRoomId((current) => current || roomsData[0]?.id || "");
    }
    if (Array.isArray(statusData.rooms)) setStatusCards(statusData.rooms);
    if (Array.isArray(bookingsData.bookings)) setBookings(bookingsData.bookings);
    if (Array.isArray(upcomingData.bookings)) {
      setUpcoming(
        upcomingData.bookings
          .filter((b: SerializedBooking) => b.status === "CONFIRMED")
          .sort(
            (a: SerializedBooking, b: SerializedBooking) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
          )
          .slice(0, 8),
      );
    }
  }, [sessionUser, visibleRange, roomFilter, isAdmin, search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!sessionUser || !roomId || !date) return;
    const controller = new AbortController();
    setChecking(true);
    const params = new URLSearchParams({
      roomId,
      date,
      durationMinutes: String(durationMinutes),
    });
    if (startTime) params.set("startTime", startTime);
    fetch(`/api/bookings/availability?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.slots)) setSlots(data.slots);
        setAvailability(data.requested ?? null);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
    return () => controller.abort();
  }, [sessionUser, roomId, date, durationMinutes, startTime]);

  const selectedRoom = rooms.find((room) => room.id === roomId);
  const endLabel = slots.find((slot) => slot.startTime === startTime)?.endTime;
  const canSubmit =
    Boolean(title.trim() && roomId && date && startTime && durationMinutes) &&
    availability?.available === true &&
    !saving;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        title,
        description,
        date,
        startTime,
        durationMinutes,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create booking.");
      return;
    }
    setMessage(data.message ?? "Boardroom booked successfully");
    setTitle("");
    setDescription("");
    await refresh();
  };

  const cancelBooking = async (booking: SerializedBooking) => {
    const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
      method: "PATCH",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not cancel booking.");
      return;
    }
    setSelected(null);
    setMessage("Booking cancelled");
    await refresh();
  };

  if (sessionUser === undefined) {
    return (
      <p className="p-6 text-sm text-muted">Loading boardroom bookings…</p>
    );
  }

  if (!sessionUser) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <BookingSignIn
          onSignedIn={async () => {
            await loadSession();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isAdmin ? "Boardroom Bookings" : "Book a boardroom"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Reserve Boardroom 1 or Boardroom 2 and check room availability.
          </p>
        </div>
        <Link
          href={myBookingsHref}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:border-accent/35"
        >
          My bookings
        </Link>
      </div>

      {message ? (
        <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-hover">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {statusCards.map((room) => (
          <article
            key={room.id}
            className={cn(
              "rounded-2xl border bg-card p-5",
              roomId === room.id ? "border-accent/50" : "border-border",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-medium text-foreground">{room.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {room.inUse ? "In use" : "Available now"}
                  {room.nextBooking
                    ? ` · Next booking: ${room.nextBooking.displayTime}`
                    : " · No upcoming bookings"}
                </p>
              </div>
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  room.inUse ? "bg-amber-400" : "bg-emerald-400",
                )}
                aria-hidden
              />
            </div>
            <button
              type="button"
              onClick={() => selectRoomToBook(room.id)}
              aria-controls="new-booking"
              className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Book
            </button>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Rooms
        </p>
        <button
          type="button"
          onClick={() => setRoomFilter("all")}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm",
            roomFilter === "all"
              ? "border-accent/40 bg-accent/15 text-accent-hover"
              : "border-border text-muted hover:text-foreground",
          )}
        >
          All Rooms
        </button>
        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => {
              setRoomFilter(room.id);
              setRoomId(room.id);
            }}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm",
              roomFilter === room.id
                ? roomTone(room.name).event
                : "border-border text-muted hover:text-foreground",
            )}
          >
            {room.name}
          </button>
        ))}
        {isAdmin ? (
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or person"
            className="ml-auto w-full max-w-xs rounded-xl border border-border bg-card px-3 py-2 text-sm"
            aria-label="Search bookings"
          />
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 xl:order-1">
          <BookingCalendar
            view={view}
            onViewChange={setView}
            cursor={cursor}
            onCursorChange={(next) => {
              setCursor(next);
              setDate(toYmd(next));
            }}
            bookings={bookings}
            selectedDate={date}
            onSelectDate={(ymd) => {
              setDate(ymd);
              setCursor(new Date(ymd));
            }}
            onSelectBooking={setSelected}
          />
        </div>

        <div className="order-1 xl:order-2 space-y-6">
          <form
            id="new-booking"
            ref={bookingSectionRef}
            onSubmit={submit}
            className="scroll-mt-6 space-y-4 rounded-2xl border border-border bg-card p-5"
          >
            <h2 className="font-medium text-foreground">
              New booking
              {selectedRoom ? ` · ${selectedRoom.name}` : ""}
            </h2>
            <div>
              <label htmlFor="booking-date" className="mb-1.5 block text-sm text-muted">
                Date
              </label>
              <input
                id="booking-date"
                type="date"
                required
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setCursor(new Date(e.target.value));
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="booking-room" className="mb-1.5 block text-sm text-muted">
                Meeting room
              </label>
              <select
                id="booking-room"
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-sm text-muted">Available times</p>
              {checking && slots.length === 0 ? (
                <p className="text-sm text-muted">Checking availability…</p>
              ) : slots.filter((s) => s.available).length === 0 ? (
                <p className="text-sm text-muted">
                  No bookings available for this day and duration.
                </p>
              ) : (
                <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1 custom-scrollbar">
                  {slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setStartTime(slot.startTime)}
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-xs",
                        slot.startTime === startTime
                          ? "border-accent/40 bg-accent/15 text-accent-hover"
                          : slot.available
                            ? "border-border text-foreground hover:bg-card-hover"
                            : "cursor-not-allowed border-border/60 text-muted/50",
                      )}
                    >
                      {slot.startTime}
                      {!slot.available ? (
                        <span className="block text-[10px]">
                          {slot.reason === "past" ? "Past" : "Booked"}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="booking-duration" className="mb-1.5 block text-sm text-muted">
                Duration
              </label>
              <select
                id="booking-duration"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              >
                {DURATION_OPTIONS_MINUTES.map((mins) => (
                  <option key={mins} value={mins}>
                    {formatDuration(mins)}
                  </option>
                ))}
              </select>
            </div>
            {startTime ? (
              <p className="text-sm text-foreground">
                {startTime} – {endLabel ?? "…"} · {formatDuration(durationMinutes)}
              </p>
            ) : null}
            {checking && startTime ? (
              <p className="text-sm text-muted">Checking availability…</p>
            ) : availability ? (
              <p
                className={
                  availability.available
                    ? "text-sm text-emerald-400"
                    : "text-sm text-red-400"
                }
              >
                {availability.available ? "Available ✓" : availability.message}
              </p>
            ) : null}
            <div>
              <label htmlFor="booking-title" className="mb-1.5 block text-sm text-muted">
                Meeting title
              </label>
              <input
                id="booking-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                placeholder="Marketing weekly"
              />
            </div>
            <div>
              <label htmlFor="booking-notes" className="mb-1.5 block text-sm text-muted">
                Notes (optional)
              </label>
              <textarea
                id="booking-notes"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm text-muted">Booked by</p>
              <p className="text-sm text-foreground">
                {sessionUser.name?.trim() || "Your Habari profile"}
              </p>
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? "Booking…" : "Book boardroom"}
            </button>
          </form>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-medium text-foreground">Upcoming bookings</h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No bookings scheduled yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {upcoming
                  .filter(
                    (item) => roomFilter === "all" || item.roomId === roomFilter,
                  )
                  .map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="w-full rounded-xl border border-border px-3 py-3 text-left hover:bg-card-hover"
                      >
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-sm text-muted">{item.roomName}</p>
                        <p className="mt-1 text-sm text-foreground">
                          {item.display.dateShort}
                          <br />
                          {item.display.timeRange}
                        </p>
                        <div className="mt-2">
                          <p className="text-[11px] uppercase tracking-wide text-muted">
                            Booked by
                          </p>
                          <BookerIdentity bookedBy={item.bookedBy} compact />
                        </div>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      {selected ? (
        <BookingDetailModal
          booking={selected}
          currentUserId={sessionUser.id}
          isAdmin={isAdmin || sessionUser.role === "admin"}
          onClose={() => setSelected(null)}
          onCancel={cancelBooking}
        />
      ) : null}
      <p className="sr-only">
        Booking as {sessionUser.name ?? "signed-in user"} for{" "}
        {selectedRoom?.name ?? "a boardroom"}.
      </p>
    </div>
  );
}

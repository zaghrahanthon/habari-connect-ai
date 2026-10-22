"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import BookingSignIn from "@/components/bookings/BookingSignIn";
import type { SerializedBooking } from "@/lib/bookings/serialize";
import {
  DURATION_OPTIONS_MINUTES,
  formatDuration,
} from "@/lib/bookings/hours";
import { toYmd } from "@/components/bookings/bookingUi";

type Lists = {
  upcoming: SerializedBooking[];
  previous: SerializedBooking[];
  cancelled: SerializedBooking[];
};

export default function MyBookingsClient() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [lists, setLists] = useState<Lists>({
    upcoming: [],
    previous: [],
    cancelled: [],
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<SerializedBooking | null>(null);
  const [editing, setEditing] = useState<SerializedBooking | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    if (!session?.user?.id) {
      setSignedIn(false);
      setReady(true);
      return;
    }
    setSignedIn(true);
    const res = await fetch("/api/bookings/my");
    const data = await res.json();
    setLists({
      upcoming: data.upcoming ?? [],
      previous: data.previous ?? [],
      cancelled: data.cancelled ?? [],
    });
    setReady(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!ready) {
    return <p className="p-6 text-sm text-muted">Loading your bookings…</p>;
  }

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <BookingSignIn onSignedIn={() => void load()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My bookings</h1>
          <p className="mt-1 text-sm text-muted">
            Upcoming, previous, and cancelled boardroom reservations.
          </p>
        </div>
        <Link
          href="/dashboard/bookings"
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Book boardroom
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

      <BookingGroup
        title="Upcoming bookings"
        empty="You have no upcoming bookings."
        items={lists.upcoming}
        actions
        onCancel={setPending}
        onEdit={setEditing}
      />
      <BookingGroup
        title="Previous bookings"
        empty="No previous bookings."
        items={lists.previous}
      />
      <BookingGroup
        title="Cancelled bookings"
        empty="No cancelled bookings."
        items={lists.cancelled}
      />

      {editing ? (
        <RescheduleForm
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={async (msg) => {
            setMessage(msg);
            setEditing(null);
            await load();
          }}
          onError={setError}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Cancel this booking?"
        description="Are you sure you want to cancel this booking?"
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          setBusy(true);
          const res = await fetch(`/api/bookings/${pending.id}/cancel`, {
            method: "PATCH",
          });
          const data = await res.json();
          setBusy(false);
          setPending(null);
          if (!res.ok) {
            setError(data.error ?? "Could not cancel booking.");
            return;
          }
          setMessage("Booking cancelled");
          await load();
        }}
      />
    </div>
  );
}

function BookingGroup({
  title,
  empty,
  items,
  actions,
  onCancel,
  onEdit,
}: {
  title: string;
  empty: string;
  items: SerializedBooking[];
  actions?: boolean;
  onCancel?: (booking: SerializedBooking) => void;
  onEdit?: (booking: SerializedBooking) => void;
}) {
  return (
    <section>
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="text-sm text-muted">{item.roomName}</p>
              <p className="mt-1 text-sm">
                {item.display.dateShort}
                <br />
                {item.display.timeRange} · {item.durationLabel}
              </p>
              <p className="mt-2 text-sm text-muted">
                Booked by {item.bookedBy.name}
                {item.bookedBy.jobTitle ? ` · ${item.bookedBy.jobTitle}` : ""}
              </p>
              {actions ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit?.(item)}
                    className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-card-hover"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancel?.(item)}
                    className="rounded-xl bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RescheduleForm({
  booking,
  onClose,
  onSaved,
  onError,
}: {
  booking: SerializedBooking;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [date, setDate] = useState(toYmd(new Date(booking.startTime)));
  const [startTime, setStartTime] = useState(booking.display.startTime);
  const [durationMinutes, setDurationMinutes] = useState(
    booking.durationMinutes,
  );
  const [title, setTitle] = useState(booking.title);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="rounded-2xl border border-border bg-card p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await fetch(`/api/bookings/${booking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            startTime,
            durationMinutes,
            title,
            roomId: booking.roomId,
          }),
        });
        const data = await res.json();
        setSaving(false);
        if (!res.ok) {
          onError(data.error ?? "Could not reschedule booking.");
          return;
        }
        await onSaved(data.message ?? "Booking updated");
      }}
    >
      <h3 className="font-medium text-foreground">Reschedule {booking.roomName}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-muted">
          Date
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="text-sm text-muted">
          Start time
          <input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="text-sm text-muted">
          Duration
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {DURATION_OPTIONS_MINUTES.map((mins) => (
              <option key={mins} value={mins}>
                {formatDuration(mins)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          Meeting title
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-border px-4 py-2 text-sm"
        >
          Close
        </button>
      </div>
    </form>
  );
}

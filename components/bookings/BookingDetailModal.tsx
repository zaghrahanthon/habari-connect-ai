"use client";

import ConfirmDialog from "@/components/admin/ConfirmDialog";
import BookerIdentity from "@/components/bookings/BookerIdentity";
import type { SerializedBooking } from "@/lib/bookings/serialize";
import { roomTone } from "@/components/bookings/bookingUi";
import { useState } from "react";

export default function BookingDetailModal({
  booking,
  currentUserId,
  isAdmin,
  onClose,
  onCancel,
}: {
  booking: SerializedBooking;
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onCancel: (booking: SerializedBooking) => Promise<void>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const tone = roomTone(booking.roomName);
  const upcoming =
    booking.status === "CONFIRMED" &&
    new Date(booking.startTime).getTime() > Date.now();
  const canCancel =
    upcoming && (isAdmin || booking.bookedBy.id === currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close booking details"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <p className={`inline-flex rounded-lg border px-2 py-1 text-xs ${tone.event}`}>
          {booking.roomName}
        </p>
        <h2
          id="booking-detail-title"
          className="mt-3 text-lg font-semibold text-foreground"
        >
          {booking.title}
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-muted">When</dt>
            <dd className="text-foreground">
              {booking.display.dateLong}
              <br />
              {booking.display.timeRange}
              <span className="text-muted"> · {booking.durationLabel}</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Booked by</dt>
            <dd className="mt-1">
              <BookerIdentity bookedBy={booking.bookedBy} />
            </dd>
          </div>
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="text-foreground">
              {booking.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
            </dd>
          </div>
          {booking.description ? (
            <div>
              <dt className="text-muted">Notes</dt>
              <dd className="text-foreground">{booking.description}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-card-hover"
          >
            Close
          </button>
          {canCancel ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
            >
              Cancel booking
            </button>
          ) : null}
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this booking?"
        description="Are you sure you want to cancel this booking? The room will become available again."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        busy={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          await onCancel(booking);
          setBusy(false);
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}

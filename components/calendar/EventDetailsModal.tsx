"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { CalendarEvent } from "@/lib/calendar/types";
import {
  formatDisplayDate,
  formatDisplayTime,
} from "@/lib/calendar/dateUtils";

type EventDetailsModalProps = {
  event: CalendarEvent | null;
  onClose: () => void;
};

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default function EventDetailsModal({
  event,
  onClose,
}: EventDetailsModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!event) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [event, onClose]);

  if (!event) return null;

  const timeLabel = event.allDay
    ? "All day"
    : [
        formatDisplayTime(event.startTime, false),
        formatDisplayTime(event.endTime, false),
      ]
        .filter(Boolean)
        .join(" – ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-details-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">
              Habari Company Calendar
            </p>
            <h2
              id="event-details-title"
              className="mt-1 text-xl font-semibold text-foreground"
            >
              {event.title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-card-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            aria-label="Close event details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-5 grid gap-4">
          <Detail label="Date" value={formatDisplayDate(event.startDate)} />
          {event.endDate && event.endDate !== event.startDate && (
            <Detail label="End date" value={formatDisplayDate(event.endDate)} />
          )}
          <Detail label="Time" value={timeLabel} />
          <Detail label="Location" value={event.location} />
          <Detail label="Category" value={event.category} />
          <Detail label="Department" value={event.department} />
          <Detail label="Organiser" value={event.organiser} />
          <Detail label="Contact email" value={event.contactEmail} />
          <Detail label="Status" value={event.status} />
          <Detail label="Description" value={event.description} />
        </dl>

        {event.registrationUrl && (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Register / Open link
          </a>
        )}
      </div>
    </div>
  );
}

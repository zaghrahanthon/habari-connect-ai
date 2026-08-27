"use client";

import type { CalendarEvent } from "@/lib/calendar/types";
import {
  formatDisplayDate,
  formatDisplayTime,
} from "@/lib/calendar/dateUtils";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<CalendarEvent["status"], string> = {
  scheduled: "bg-accent/15 text-accent-hover",
  postponed: "bg-amber-500/15 text-amber-300",
  cancelled: "bg-red-500/15 text-red-300 line-through",
  completed: "bg-zinc-500/20 text-zinc-300",
};

type EventCardProps = {
  event: CalendarEvent;
  onSelect: (event: CalendarEvent) => void;
  compact?: boolean;
};

export default function EventCard({
  event,
  onSelect,
  compact = false,
}: EventCardProps) {
  const timeLabel = formatDisplayTime(event.startTime, event.allDay);
  const endTimeLabel =
    !event.allDay && event.endTime
      ? formatDisplayTime(event.endTime, false)
      : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className={cn(
        "w-full rounded-2xl border border-border bg-card text-left transition-colors hover:border-accent/40 hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        compact ? "p-3" : "p-4",
        event.status === "cancelled" && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          className={cn(
            "text-base font-semibold text-foreground",
            event.status === "cancelled" && "line-through",
          )}
        >
          {event.title}
        </h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
            STATUS_STYLES[event.status],
          )}
        >
          {event.status}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted">
        {formatDisplayDate(event.startDate)}
        {timeLabel ? ` · ${timeLabel}` : ""}
        {endTimeLabel ? ` – ${endTimeLabel}` : ""}
      </p>

      {event.location && (
        <p className="mt-1 text-sm text-muted">📍 {event.location}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {event.category && (
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            {event.category}
          </span>
        )}
        {event.department && (
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            {event.department}
          </span>
        )}
      </div>

      {event.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted">{event.description}</p>
      )}

      {event.organiser && (
        <p className="mt-2 text-xs text-muted">Organised by {event.organiser}</p>
      )}
    </button>
  );
}

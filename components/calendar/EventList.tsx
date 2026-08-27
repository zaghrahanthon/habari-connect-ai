"use client";

import type { CalendarEvent } from "@/lib/calendar/types";
import EventCard from "@/components/calendar/EventCard";
import { cn } from "@/lib/utils";

type EventListProps = {
  events: CalendarEvent[];
  onSelect: (event: CalendarEvent) => void;
  compact?: boolean;
};

export default function EventList({
  events,
  onSelect,
  compact = false,
}: EventListProps) {
  if (events.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-border bg-card/50 text-center",
          compact ? "px-4 py-8" : "px-6 py-12",
        )}
      >
        <p className="text-sm font-medium text-foreground">No events found</p>
        {!compact ? (
          <p className="mt-2 text-sm text-muted">
            Try another date range or clear your filters.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3", compact && "gap-2")}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onSelect={onSelect}
          compact={compact}
        />
      ))}
    </div>
  );
}

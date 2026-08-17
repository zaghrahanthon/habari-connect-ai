"use client";

import type { CalendarEvent } from "@/lib/calendar/types";
import EventCard from "@/components/calendar/EventCard";

type EventListProps = {
  events: CalendarEvent[];
  onSelect: (event: CalendarEvent) => void;
};

export default function EventList({ events, onSelect }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">No events found</p>
        <p className="mt-2 text-sm text-muted">
          Try another date range or clear your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} onSelect={onSelect} />
      ))}
    </div>
  );
}

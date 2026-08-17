"use client";

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarEvent } from "@/lib/calendar/types";
import { todayDateString } from "@/lib/calendar/dateUtils";
import { cn } from "@/lib/utils";

type CalendarGridProps = {
  events: CalendarEvent[];
  monthAnchor: string;
  onSelect: (event: CalendarEvent) => void;
  onMonthChange: (date: string) => void;
};

export default function CalendarGrid({
  events,
  monthAnchor,
  onSelect,
  onMonthChange,
}: CalendarGridProps) {
  const anchor = parseISO(`${monthAnchor}T12:00:00`);
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const today = todayDateString();

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = eventsByDate.get(event.startDate) ?? [];
    list.push(event);
    eventsByDate.set(event.startDate, list);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground"
          onClick={() =>
            onMonthChange(format(addDays(monthStart, -1), "yyyy-MM-dd"))
          }
        >
          Previous
        </button>
        <h3 className="text-base font-semibold text-foreground">
          {format(anchor, "MMMM yyyy")}
        </h3>
        <button
          type="button"
          className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground"
          onClick={() =>
            onMonthChange(format(addDays(monthEnd, 1), "yyyy-MM-dd"))
          }
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-wide text-muted">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(key) ?? [];
          const inMonth = isSameMonth(day, anchor);
          const isToday = key === today;

          return (
            <div
              key={key}
              className={cn(
                "min-h-24 rounded-xl border border-border/60 p-1.5",
                inMonth ? "bg-background" : "bg-card/40 opacity-60",
                isToday && "border-accent/50",
              )}
            >
              <div
                className={cn(
                  "mb-1 text-xs font-medium",
                  isSameDay(day, new Date()) ? "text-accent-hover" : "text-muted",
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelect(event)}
                    className={cn(
                      "block w-full truncate rounded-md bg-accent/15 px-1.5 py-0.5 text-left text-[10px] font-medium text-accent-hover hover:bg-accent/25",
                      event.status === "cancelled" && "line-through opacity-60",
                    )}
                    title={event.title}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-muted">
                    +{dayEvents.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

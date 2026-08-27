"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CalendarEvent } from "@/lib/calendar/types";
import {
  formatDisplayDate,
  formatDisplayTime,
} from "@/lib/calendar/dateUtils";

const POLL_MS = 5 * 60 * 1000;

export default function UpcomingEventsWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/calendar/events?view=upcoming&limit=5", {
          cache: "no-store",
        });
        if (res.status === 401) {
          if (!cancelled) {
            setError(null);
            setEvents([]);
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as {
          events?: CalendarEvent[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Calendar unavailable");
        }
        if (!cancelled) {
          setEvents(data.events ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Calendar unavailable",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const boot = window.setTimeout(() => void load(), 0);
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, []);

  return (
    <section className="h-full rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Upcoming Events
          </h2>
          <p className="mt-0.5 text-xs text-muted">What’s next at Habari</p>
        </div>
        <Link
          href="/dashboard/calendar"
          className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          View Calendar
        </Link>
      </div>

      {loading && (
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-background"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="mt-4 text-sm text-muted">
          Calendar updates are temporarily unavailable.
        </p>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          No upcoming events are scheduled right now.
        </p>
      )}

      {!loading && !error && events.length > 0 && (
        <ul className="mt-4 space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-border bg-background px-4 py-3"
            >
              <p className="font-medium text-foreground">{event.title}</p>
              <p className="mt-1 text-sm text-muted">
                {formatDisplayDate(event.startDate)}
                {formatDisplayTime(event.startTime, event.allDay)
                  ? ` · ${formatDisplayTime(event.startTime, event.allDay)}`
                  : ""}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

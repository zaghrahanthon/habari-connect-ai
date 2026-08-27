"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CalendarEvent } from "@/lib/calendar/types";
import {
  getMonthRange,
  getWeekRange,
  todayDateString,
} from "@/lib/calendar/dateUtils";
import { filterCalendarEvents } from "@/lib/calendar/filters";
import CalendarStatus from "@/components/calendar/CalendarStatus";
import CalendarToolbar, {
  type CalendarDisplayMode,
  type CalendarPreset,
} from "@/components/calendar/CalendarToolbar";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import EventList from "@/components/calendar/EventList";
import EventDetailsModal from "@/components/calendar/EventDetailsModal";

const POLL_MS = 5 * 60 * 1000;

export default function CalendarPageClient() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [preset, setPreset] = useState<CalendarPreset>("upcoming");
  const [mode, setMode] = useState<CalendarDisplayMode>("list");
  const [monthAnchor, setMonthAnchor] = useState(todayDateString());

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    try {
      const url = refresh
        ? "/api/calendar/events?view=all&includeCancelled=1&refresh=1"
        : "/api/calendar/events?view=all&includeCancelled=1";
      const res = await fetch(url, { cache: "no-store" });
      const data = (await res.json()) as {
        events?: CalendarEvent[];
        syncedAt?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load calendar");
      setEvents(data.events ?? []);
      setSyncedAt(data.syncedAt ?? null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The company calendar is temporarily unavailable. Please try again shortly.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer so the effect itself doesn't synchronously set state (lint-safe fetch).
    const boot = window.setTimeout(() => void load(false), 0);
    const id = window.setInterval(() => void load(false), POLL_MS);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, [load]);

  const categories = useMemo(
    () =>
      [...new Set(events.map((e) => e.category).filter(Boolean) as string[])].sort(),
    [events],
  );
  const departments = useMemo(
    () =>
      [
        ...new Set(events.map((e) => e.department).filter(Boolean) as string[]),
      ].sort(),
    [events],
  );

  const visibleEvents = useMemo(() => {
    const today = todayDateString();
    let startDate: string | undefined;
    let endDate: string | undefined;
    let view: "upcoming" | "past" | "all" = "upcoming";

    if (preset === "today") {
      startDate = today;
      endDate = today;
      view = "all";
    } else if (preset === "week") {
      const range = getWeekRange(today);
      startDate = range.start;
      endDate = range.end;
      view = "all";
    } else if (preset === "month") {
      const range = getMonthRange(monthAnchor);
      startDate = range.start;
      endDate = range.end;
      view = "all";
    } else if (preset === "all") {
      view = "all";
    }

    return filterCalendarEvents(events, {
      view,
      startDate,
      endDate,
      category: category || undefined,
      department: department || undefined,
      search: search || undefined,
      includeCancelled: true,
    });
  }, [events, preset, category, department, search, monthAnchor]);

  const upcomingPreview = useMemo(
    () =>
      filterCalendarEvents(events, {
        view: "upcoming",
        includeCancelled: false,
      }).slice(0, 5),
    [events],
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Calendar & Events
          </h1>
          <p className="mt-2 text-sm text-muted sm:text-base">
            See what&apos;s happening across Habari. Updates from Google Sheets
            appear automatically.
          </p>
        </div>
      </header>

      <CalendarStatus
        syncedAt={syncedAt}
        loading={loading}
        onRefresh={() => void load(true)}
      />

      <CalendarToolbar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        department={department}
        onDepartmentChange={setDepartment}
        categories={categories}
        departments={departments}
        preset={preset}
        onPresetChange={setPreset}
        mode={mode}
        onModeChange={setMode}
      />

      {loading && events.length === 0 && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card lg:col-span-4" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!error && mode === "list" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <EventList events={visibleEvents} onSelect={setSelected} />
          </div>
          <aside className="lg:col-span-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">
                Upcoming events
              </p>
              <p className="mt-1 text-xs text-muted">
                Next dates across Habari
              </p>
              <div className="mt-4">
                <EventList
                  events={upcomingPreview}
                  onSelect={setSelected}
                  compact
                />
              </div>
            </div>
          </aside>
        </div>
      )}

      {!error && mode === "calendar" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <CalendarGrid
              events={visibleEvents}
              monthAnchor={monthAnchor}
              onSelect={setSelected}
              onMonthChange={(date) => {
                setMonthAnchor(date);
                setPreset("month");
              }}
            />
          </div>
          <aside className="lg:col-span-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">
                Upcoming events
              </p>
              <div className="mt-4">
                <EventList
                  events={upcomingPreview}
                  onSelect={setSelected}
                  compact
                />
              </div>
            </div>
          </aside>
        </div>
      )}

      <EventDetailsModal event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

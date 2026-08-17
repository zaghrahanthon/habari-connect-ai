import {
  addDaysToDateString,
  compareEventsByStart,
  getMonthRange,
  getWeekRange,
  todayDateString,
} from "@/lib/calendar/dateUtils";
import type { CalendarEvent } from "@/lib/calendar/types";

export type CalendarView = "upcoming" | "past" | "all";

export type CalendarQuery = {
  view?: CalendarView;
  date?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  department?: string;
  search?: string;
  limit?: number;
  includeCancelled?: boolean;
};

const CALENDAR_QUESTION_RE =
  /\b(event|events|calendar|meeting|meetings|braai|training|launch|launches|workshop|activity|activities|function|functions|happening|schedule|scheduled|upcoming|today|tomorrow|this week|this month|staff event|company event|where is|what time|organiser|organizer)\b/i;

export function isCalendarQuestion(query: string): boolean {
  return CALENDAR_QUESTION_RE.test(query);
}

export function filterCalendarEvents(
  events: CalendarEvent[],
  query: CalendarQuery = {},
): CalendarEvent[] {
  const today = todayDateString();
  const view = query.view ?? "upcoming";
  const search = query.search?.trim().toLowerCase();

  let filtered = events.filter((event) => {
    if (!query.includeCancelled && event.status === "cancelled") return false;

    if (query.date && event.startDate !== query.date) return false;

    if (query.startDate && event.startDate < query.startDate) return false;
    if (query.endDate && event.startDate > query.endDate) return false;

    if (
      query.category &&
      (event.category ?? "").toLowerCase() !== query.category.toLowerCase()
    ) {
      return false;
    }

    if (
      query.department &&
      (event.department ?? "").toLowerCase() !== query.department.toLowerCase()
    ) {
      return false;
    }

    if (search) {
      const haystack = [
        event.title,
        event.description,
        event.location,
        event.category,
        event.department,
        event.organiser,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (view === "upcoming") {
      return (
        event.startDate >= today ||
        Boolean(event.endDate && event.endDate >= today)
      );
    }
    if (view === "past") {
      return event.startDate < today;
    }
    return true;
  });

  filtered = [...filtered].sort(compareEventsByStart);
  if (view === "past") filtered = filtered.reverse();

  if (query.limit && query.limit > 0) {
    filtered = filtered.slice(0, query.limit);
  }

  return filtered;
}

export function getEventsForDate(events: CalendarEvent[], date: string) {
  return filterCalendarEvents(events, {
    view: "all",
    date,
    includeCancelled: false,
  });
}

export function getEventsForDateRange(
  events: CalendarEvent[],
  startDate: string,
  endDate: string,
) {
  return filterCalendarEvents(events, {
    view: "all",
    startDate,
    endDate,
    includeCancelled: false,
  });
}

export function getUpcomingEvents(events: CalendarEvent[], limit = 5) {
  return filterCalendarEvents(events, { view: "upcoming", limit });
}

export function getNextEvent(events: CalendarEvent[]) {
  return getUpcomingEvents(events, 1)[0] ?? null;
}

export function searchCalendarEvents(events: CalendarEvent[], search: string) {
  return filterCalendarEvents(events, {
    view: "all",
    search,
    includeCancelled: false,
  });
}

export function selectEventsForAiQuestion(
  events: CalendarEvent[],
  question: string,
): CalendarEvent[] {
  const q = question.toLowerCase();
  const today = todayDateString();

  if (/\btoday\b/.test(q)) {
    return getEventsForDate(events, today);
  }
  if (/\btomorrow\b/.test(q)) {
    return getEventsForDate(events, addDaysToDateString(today, 1));
  }
  if (/\bthis week\b/.test(q)) {
    const range = getWeekRange(today);
    return getEventsForDateRange(events, range.start, range.end);
  }
  if (/\bthis month\b/.test(q)) {
    const range = getMonthRange(today);
    return getEventsForDateRange(events, range.start, range.end);
  }
  if (/\bnext\b/.test(q) && /\bevent\b/.test(q)) {
    const next = getNextEvent(events);
    return next ? [next] : [];
  }

  const stop = new Set([
    "what",
    "when",
    "where",
    "who",
    "is",
    "are",
    "the",
    "a",
    "an",
    "in",
    "on",
    "at",
    "for",
    "me",
    "any",
    "show",
    "tell",
    "about",
    "happening",
    "events",
    "event",
    "company",
    "staff",
    "calendar",
    "please",
    "does",
    "do",
    "start",
    "time",
  ]);
  const terms = q
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stop.has(t));

  if (terms.length > 0) {
    const matched = events.filter((event) => {
      if (event.status === "cancelled") return false;
      const haystack = [
        event.title,
        event.description,
        event.location,
        event.category,
        event.department,
        event.organiser,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return terms.some((term) => haystack.includes(term));
    });
    if (matched.length > 0) {
      return filterCalendarEvents(matched, { view: "upcoming", limit: 12 });
    }
  }

  return getUpcomingEvents(events, 8);
}

export function formatEventsForAi(events: CalendarEvent[]): string {
  if (events.length === 0) {
    return "No matching events were found in the live Habari company calendar.";
  }

  return events
    .map((event, index) => {
      const lines = [
        `${index + 1}. ${event.title}`,
        `Date: ${event.startDate}${event.endDate && event.endDate !== event.startDate ? ` to ${event.endDate}` : ""}`,
      ];
      if (event.allDay) lines.push("Time: All day");
      else if (event.startTime) {
        lines.push(
          `Time: ${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}`,
        );
      }
      if (event.location) lines.push(`Location: ${event.location}`);
      if (event.category) lines.push(`Category: ${event.category}`);
      if (event.department) lines.push(`Department: ${event.department}`);
      if (event.organiser) lines.push(`Organiser: ${event.organiser}`);
      if (event.contactEmail) lines.push(`Contact: ${event.contactEmail}`);
      if (event.registrationUrl) {
        lines.push(`Registration: ${event.registrationUrl}`);
      }
      if (event.description) lines.push(`Description: ${event.description}`);
      lines.push(`Status: ${event.status}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

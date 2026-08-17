import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/lib/calendar/types";
import {
  filterCalendarEvents,
  formatEventsForAi,
  getEventsForDate,
  getUpcomingEvents,
  isCalendarQuestion,
  selectEventsForAiQuestion,
} from "@/lib/calendar/filters";
import { todayDateString, addDaysToDateString } from "@/lib/calendar/dateUtils";

function event(
  overrides: Partial<CalendarEvent> & Pick<CalendarEvent, "title" | "startDate">,
): CalendarEvent {
  return {
    id: overrides.id ?? overrides.title,
    description: null,
    endDate: null,
    startTime: null,
    endTime: null,
    location: null,
    category: null,
    department: null,
    organiser: null,
    contactEmail: null,
    registrationUrl: null,
    imageUrl: null,
    status: "scheduled",
    allDay: true,
    sourceRow: 2,
    ...overrides,
  };
}

describe("filterCalendarEvents", () => {
  const today = todayDateString();
  const tomorrow = addDaysToDateString(today, 1);
  const yesterday = addDaysToDateString(today, -1);

  const events = [
    event({ title: "Company Braai", startDate: tomorrow, location: "Cape Town", startTime: "12:00", allDay: false }),
    event({ title: "Training", startDate: today, category: "Learning", department: "HR" }),
    event({ title: "Old Town Hall", startDate: yesterday }),
    event({ title: "Cancelled Mixer", startDate: tomorrow, status: "cancelled" }),
  ];

  it("returns upcoming by default and excludes cancelled", () => {
    const result = filterCalendarEvents(events);
    expect(result.map((e) => e.title)).toEqual(["Training", "Company Braai"]);
  });

  it("filters today", () => {
    expect(getEventsForDate(events, today).map((e) => e.title)).toEqual([
      "Training",
    ]);
  });

  it("supports search and category", () => {
    const result = filterCalendarEvents(events, {
      view: "all",
      search: "cape town",
      includeCancelled: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Company Braai");
  });

  it("sorts chronologically", () => {
    const result = getUpcomingEvents(events, 10);
    expect(result[0]?.title).toBe("Training");
    expect(result[1]?.title).toBe("Company Braai");
  });
});

describe("calendar AI helpers", () => {
  it("detects calendar questions", () => {
    expect(isCalendarQuestion("What events are happening today?")).toBe(true);
    expect(isCalendarQuestion("How do I reset my password?")).toBe(false);
  });

  it("selects today events deterministically", () => {
    const today = todayDateString();
    const events = [
      event({ title: "Standup", startDate: today }),
      event({ title: "Later", startDate: addDaysToDateString(today, 3) }),
    ];
    const selected = selectEventsForAiQuestion(
      events,
      "What is happening today?",
    );
    expect(selected.map((e) => e.title)).toEqual(["Standup"]);
  });

  it("formats events for AI without inventing fields", () => {
    const text = formatEventsForAi([
      event({
        title: "Braai",
        startDate: "2026-08-20",
        startTime: "13:00",
        allDay: false,
        location: "Cape Town",
      }),
    ]);
    expect(text).toContain("Braai");
    expect(text).toContain("2026-08-20");
    expect(text).toContain("13:00");
    expect(text).toContain("Cape Town");
  });
});

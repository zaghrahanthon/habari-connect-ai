import { describe, expect, it } from "vitest";
import { buildColumnMap, normalizeHeader } from "@/lib/calendar/headerMapping";

describe("normalizeHeader", () => {
  it("normalises casing, hyphens, underscores and spaces", () => {
    expect(normalizeHeader(" Event_Title ")).toBe("event title");
    expect(normalizeHeader("Start-Date")).toBe("start date");
    expect(normalizeHeader("ALL   DAY")).toBe("all day");
  });
});

describe("buildColumnMap", () => {
  it("maps common header aliases", () => {
    const { map, missingRequired } = buildColumnMap([
      "Event Name",
      "Date",
      "Start Time",
      "Venue",
      "Event Type",
      "Team",
      "Host",
      "Contact Email",
      "Booking Link",
    ]);

    expect(missingRequired).toEqual([]);
    expect(map.title).toBe(0);
    expect(map.startDate).toBe(1);
    expect(map.startTime).toBe(2);
    expect(map.location).toBe(3);
    expect(map.category).toBe(4);
    expect(map.department).toBe(5);
    expect(map.organiser).toBe(6);
    expect(map.contactEmail).toBe(7);
    expect(map.registrationUrl).toBe(8);
  });

  it("reports missing required headers", () => {
    const { missingRequired } = buildColumnMap(["Location", "Notes"]);
    expect(missingRequired.length).toBeGreaterThan(0);
  });
});

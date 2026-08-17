import { describe, expect, it } from "vitest";
import {
  compareEventsByStart,
  googleSerialToDateString,
  parseSheetDate,
  parseSheetTime,
} from "@/lib/calendar/dateUtils";

describe("parseSheetDate", () => {
  it("parses ISO dates", () => {
    expect(parseSheetDate("2026-08-15")).toBe("2026-08-15");
  });

  it("prefers South African DD/MM/YYYY", () => {
    expect(parseSheetDate("15/08/2026")).toBe("2026-08-15");
    expect(parseSheetDate("03/04/2026")).toBe("2026-04-03");
  });

  it("parses DD-MM-YYYY", () => {
    expect(parseSheetDate("15-08-2026")).toBe("2026-08-15");
  });

  it("handles Google Sheets serial dates", () => {
    // Sheets serial = days since 1899-12-30
    const serial =
      (Date.UTC(2026, 7, 15) - Date.UTC(1899, 11, 30)) / 86400000;
    expect(googleSerialToDateString(serial)).toBe("2026-08-15");
    expect(parseSheetDate(serial)).toBe("2026-08-15");
  });

  it("returns null for empty values", () => {
    expect(parseSheetDate("")).toBeNull();
    expect(parseSheetDate(null)).toBeNull();
  });
});

describe("parseSheetTime", () => {
  it("parses 24h and 12h times", () => {
    expect(parseSheetTime("14:30")).toBe("14:30");
    expect(parseSheetTime("2:30 pm")).toBe("14:30");
    expect(parseSheetTime("12:15 am")).toBe("00:15");
  });

  it("parses Google Sheets time fractions", () => {
    expect(parseSheetTime(0.5)).toBe("12:00");
  });
});

describe("compareEventsByStart", () => {
  it("sorts by date then time", () => {
    const a = { startDate: "2026-08-15", startTime: "10:00" };
    const b = { startDate: "2026-08-15", startTime: "09:00" };
    const c = { startDate: "2026-08-14", startTime: null };
    expect(compareEventsByStart(b, a)).toBeLessThan(0);
    expect(compareEventsByStart(c, b)).toBeLessThan(0);
  });
});

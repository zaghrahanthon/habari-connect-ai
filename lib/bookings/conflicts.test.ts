import { describe, expect, it } from "vitest";
import { findOverlappingBooking, rangesOverlap } from "@/lib/bookings/conflicts";
import { canCancelBooking } from "@/lib/bookings/permissions";
import { buildDaySlots } from "@/lib/bookings/slots";
import {
  addMinutes,
  validateBookingWindow,
  zonedDateTime,
} from "@/lib/bookings/time";

function t(date: string, time: string) {
  return zonedDateTime(date, time);
}

describe("boardroom overlap rules", () => {
  const existingStart = t("2026-10-08", "10:00");
  const existingEnd = t("2026-10-08", "11:00");

  const cases: Array<[string, string, string, boolean]> = [
    ["09:00", "10:00", "allowed adjacent before", false],
    ["11:00", "12:00", "allowed adjacent after", false],
    ["09:30", "10:30", "overlap start", true],
    ["10:00", "11:00", "exact match", true],
    ["10:30", "11:30", "overlap end", true],
    ["09:00", "12:00", "surrounding", true],
    ["10:15", "10:45", "inside", true],
  ];

  it.each(cases)("%s–%s %s", (start, end, _label, shouldOverlap) => {
    expect(
      rangesOverlap(
        existingStart,
        existingEnd,
        t("2026-10-08", start),
        t("2026-10-08", end),
      ),
    ).toBe(shouldOverlap);
  });

  it("allows the same time in a different room by only checking provided bookings", () => {
    const conflict = findOverlappingBooking(
      [{ startTime: existingStart, endTime: existingEnd }],
      { startTime: t("2026-10-08", "10:30"), endTime: t("2026-10-08", "11:30") },
    );
    expect(conflict).toBeTruthy();
    expect(
      findOverlappingBooking([], {
        startTime: t("2026-10-08", "10:30"),
        endTime: t("2026-10-08", "11:30"),
      }),
    ).toBeUndefined();
  });
});

describe("booking window validation", () => {
  const now = t("2026-10-08", "09:00");

  it("rejects past start times", () => {
    const start = t("2026-10-08", "08:30");
    const end = addMinutes(start, 60);
    expect(validateBookingWindow(start, end, 60, now)).toBe("in-the-past");
  });

  it("rejects weekends", () => {
    const start = t("2026-10-10", "10:00");
    const end = addMinutes(start, 60);
    expect(validateBookingWindow(start, end, 60, t("2026-10-08", "09:00"))).toBe(
      "weekend",
    );
  });

  it("rejects times outside 08:00–17:00", () => {
    const start = t("2026-10-08", "16:30");
    const end = addMinutes(start, 60);
    expect(validateBookingWindow(start, end, 60, now)).toBe(
      "outside-business-hours",
    );
  });

  it("rejects endTime <= startTime", () => {
    const start = t("2026-10-08", "10:00");
    expect(validateBookingWindow(start, start, 60, now)).toBe("invalid-range");
  });

  it("allows a valid weekday window", () => {
    const start = t("2026-10-08", "10:00");
    const end = addMinutes(start, 60);
    expect(validateBookingWindow(start, end, 60, now)).toBeNull();
  });
});

describe("available slots consider duration", () => {
  it("does not offer 09:30 for a 1-hour booking when 10:00–11:00 is taken", () => {
    const occupied = [
      {
        startTime: t("2026-10-08", "10:00"),
        endTime: t("2026-10-08", "11:00"),
      },
    ];
    const slots = buildDaySlots("2026-10-08", 60, occupied, t("2026-10-08", "07:00"));
    const nineThirty = slots.find((slot) => slot.startTime === "09:30");
    const nine = slots.find((slot) => slot.startTime === "09:00");
    const eleven = slots.find((slot) => slot.startTime === "11:00");
    expect(nineThirty?.available).toBe(false);
    expect(nine?.available).toBe(true);
    expect(eleven?.available).toBe(true);
  });
});

describe("cancel permissions", () => {
  const future = t("2026-10-08", "15:00");
  const past = t("2026-10-08", "08:00");
  const now = t("2026-10-08", "09:00");

  it("lets an employee cancel their own future booking", () => {
    expect(
      canCancelBooking(
        { id: "u1", role: "employee" },
        { userId: "u1", status: "CONFIRMED", startTime: future },
        now,
      ).ok,
    ).toBe(true);
  });

  it("rejects an employee cancelling someone else's booking", () => {
    const result = canCancelBooking(
      { id: "u1", role: "employee" },
      { userId: "u2", status: "CONFIRMED", startTime: future },
      now,
    );
    expect(result.ok).toBe(false);
  });

  it("lets an admin cancel another user's future booking", () => {
    expect(
      canCancelBooking(
        { id: "admin", role: "admin" },
        { userId: "u2", status: "CONFIRMED", startTime: future },
        now,
      ).ok,
    ).toBe(true);
  });

  it("rejects cancelling a past booking", () => {
    const result = canCancelBooking(
      { id: "u1", role: "employee" },
      { userId: "u1", status: "CONFIRMED", startTime: past },
      now,
    );
    expect(result.ok).toBe(false);
  });
});

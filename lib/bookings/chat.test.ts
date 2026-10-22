import { describe, expect, it } from "vitest";
import {
  isBoardroomQuery,
  parseBoardroomDraft,
  wantsBookingConfirm,
} from "@/lib/bookings/chat";

describe("chat boardroom parsing", () => {
  it("detects a booking request", () => {
    expect(
      isBoardroomQuery("Book boardroom 1 tomorrow at 10:00 for 1 hour"),
    ).toBe(true);
  });

  it("parses room, time, duration and tomorrow-style dates", () => {
    const draft = parseBoardroomDraft([
      {
        role: "user",
        content: "Book Boardroom 2 on 2026-10-09 at 14:30 for 45 minutes",
      },
    ]);
    expect(draft.roomName).toBe("Boardroom 2");
    expect(draft.date).toBe("2026-10-09");
    expect(draft.startTime).toBe("14:30");
    expect(draft.durationMinutes).toBe(45);
  });

  it("defaults duration to 1 hour when only a start time is given", () => {
    const draft = parseBoardroomDraft([
      {
        role: "user",
        content: "Please book boardroom 1 on 2026-10-08 at 10am",
      },
    ]);
    expect(draft.startTime).toBe("10:00");
    expect(draft.durationMinutes).toBe(60);
  });

  it("recognises confirm booking", () => {
    expect(wantsBookingConfirm("confirm booking")).toBe(true);
  });
});

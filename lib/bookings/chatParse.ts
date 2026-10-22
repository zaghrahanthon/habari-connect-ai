import {
  DURATION_OPTIONS_MINUTES,
  BOOKING_TIMEZONE,
  isAllowedDuration,
} from "@/lib/bookings/hours";
import { padTime } from "@/lib/bookings/time";

export type ChatMessage = { role: string; content: string };

export type BoardroomDraft = {
  roomName: string | null;
  date: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  title: string | null;
};

export function isBoardroomQuery(query: string): boolean {
  return (
    /\bboard\s*rooms?\b/i.test(query) ||
    /\bmeeting rooms?\b/i.test(query) ||
    /\bbook(ing)?\b.+\b(room|boardroom)\b/i.test(query) ||
    /\b(reserve|reservation)\b.+\b(room|boardroom)\b/i.test(query) ||
    /\b(room|boardroom).+\b(book|reserve|available|free|availability)\b/i.test(
      query,
    ) ||
    /\bconfirm (the )?(booking|boardroom|reservation)\b/i.test(query)
  );
}

export function wantsBookingConfirm(query: string): boolean {
  return (
    /\bconfirm (the )?(booking|boardroom|reservation)\b/i.test(query) ||
    /\b(yes,? )?(please )?book it\b/i.test(query) ||
    /\bgo ahead and book\b/i.test(query) ||
    /^confirm$/i.test(query.trim())
  );
}

export function conversationText(messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");
}

function parseRoomName(text: string): string | null {
  const match = text.match(/\b(?:board\s*room|room)\s*(1|2)\b/i);
  if (!match) return null;
  return `Boardroom ${match[1]}`;
}

function parseTime(text: string): string | null {
  const twentyFour = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  if (twentyFour) {
    return padTime(Number(twentyFour[1]), Number(twentyFour[2]));
  }

  const meridiem = text.match(/\b(1[0-2]|[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (meridiem) {
    let hours = Number(meridiem[1]);
    const minutes = Number(meridiem[2] ?? "0");
    const period = meridiem[3].toLowerCase();
    if (period === "pm" && hours < 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;
    return padTime(hours, minutes);
  }

  return null;
}

function parseDurationMinutes(text: string): number | null {
  const hourAndHalf =
    /\b(1\s*hour\s*(and\s*)?30|an\s*hour\s*and\s*a\s*half|hour\s*and\s*a\s*half|1\.5\s*hours?)\b/i;
  if (hourAndHalf.test(text)) return 90;

  const hoursMins = text.match(
    /\b(\d+)\s*(?:hours?|hrs?|h)\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?)?\b/i,
  );
  if (hoursMins) {
    return snapDuration(Number(hoursMins[1]) * 60 + Number(hoursMins[2]));
  }

  const hours = text.match(/\b(\d+(?:\.\d+)?)\s*(hours?|hrs?)\b/i);
  if (hours) {
    return snapDuration(Math.round(Number(hours[1]) * 60));
  }

  const minutes = text.match(/\b(\d+)\s*(minutes?|mins?)\b/i);
  if (minutes) {
    return snapDuration(Number(minutes[1]));
  }

  const range = text.match(
    /\bfrom\s+([01]?\d|2[0-3])[:.]([0-5]\d)\s+(?:to|until|-)\s+([01]?\d|2[0-3])[:.]([0-5]\d)\b/i,
  );
  if (range) {
    const start = Number(range[1]) * 60 + Number(range[2]);
    const end = Number(range[3]) * 60 + Number(range[4]);
    return snapDuration(end - start);
  }

  return null;
}

function snapDuration(minutes: number): number | null {
  if (minutes <= 0) return null;
  if (isAllowedDuration(minutes)) return minutes;
  let best: number | null = null;
  let bestDiff = 16;
  for (const option of DURATION_OPTIONS_MINUTES) {
    const diff = Math.abs(option - minutes);
    if (diff < bestDiff) {
      best = option;
      bestDiff = diff;
    }
  }
  return best;
}

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function ymdInZone(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIMEZONE,
  }).format(date);
}

function addCalendarDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

function parseDate(text: string, now = new Date()): string | null {
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  const lower = text.toLowerCase();
  const today = ymdInZone(now);
  if (/\btoday\b/i.test(lower)) return today;
  if (/\btomorrow\b/i.test(lower)) return addCalendarDays(today, 1);

  const named = lower.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+(\d{4}))?\b/i,
  );
  if (named) {
    const day = Number(named[1]);
    const month = MONTHS[named[2].toLowerCase()];
    const year = named[3] ? Number(named[3]) : Number(today.slice(0, 4));
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const todayUtc = new Date(`${today}T12:00:00Z`);
  const current = todayUtc.getUTCDay();
  for (let i = 0; i < weekdays.length; i++) {
    if (new RegExp(`\\b${weekdays[i]}\\b`, "i").test(lower)) {
      let ahead = (i - current + 7) % 7;
      if (ahead === 0) ahead = 7;
      return addCalendarDays(today, ahead);
    }
  }

  return null;
}

function parseTitle(text: string): string | null {
  const quoted = text.match(/["“]([^"”]+)["”]/);
  if (quoted?.[1]?.trim()) return quoted[1].trim().slice(0, 160);

  const labelled = text.match(
    /\b(?:title|called|named|titled|meeting(?: called| titled)?)\s*[:\-]\s*(.+)$/im,
  );
  if (labelled?.[1]?.trim()) {
    return labelled[1].replace(/\bconfirm\b.*$/i, "").trim().slice(0, 160);
  }

  return null;
}

export function parseBoardroomDraft(messages: ChatMessage[]): BoardroomDraft {
  const text = conversationText(messages);
  return {
    roomName: parseRoomName(text),
    date: parseDate(text),
    startTime: parseTime(text),
    durationMinutes: parseDurationMinutes(text) ?? (parseTime(text) ? 60 : null),
    title: parseTitle(text),
  };
}

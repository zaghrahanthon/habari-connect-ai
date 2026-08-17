export type CalendarField =
  | "title"
  | "description"
  | "startDate"
  | "endDate"
  | "startTime"
  | "endTime"
  | "location"
  | "category"
  | "department"
  | "organiser"
  | "contactEmail"
  | "registrationUrl"
  | "imageUrl"
  | "status"
  | "allDay";

const HEADER_ALIASES: Record<CalendarField, string[]> = {
  title: ["title", "event", "event name", "event title", "name"],
  description: ["description", "details", "event description", "notes"],
  startDate: ["date", "start date", "event date", "from date"],
  endDate: ["end date", "finish date", "to date"],
  startTime: ["time", "start time", "event time"],
  endTime: ["end time", "finish time"],
  location: ["location", "venue", "address", "place"],
  category: ["category", "event type", "type"],
  department: ["department", "team", "division"],
  organiser: ["organiser", "organizer", "host", "owner"],
  contactEmail: [
    "email",
    "contact email",
    "organiser email",
    "organizer email",
  ],
  registrationUrl: [
    "registration url",
    "registration link",
    "booking link",
    "event link",
    "link",
    "url",
  ],
  imageUrl: ["image", "image url", "cover image", "banner"],
  status: ["status", "event status"],
  allDay: ["all day", "all-day", "allday"],
};

export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_/]+/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

export type ColumnMap = Partial<Record<CalendarField, number>>;

export function buildColumnMap(headers: string[]): {
  map: ColumnMap;
  missingRequired: string[];
  normalizedHeaders: string[];
} {
  const normalizedHeaders = headers.map((h) => normalizeHeader(String(h ?? "")));
  const map: ColumnMap = {};

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
    CalendarField,
    string[],
  ][]) {
    const index = normalizedHeaders.findIndex((h) => aliases.includes(h));
    if (index !== -1) {
      map[field] = index;
    }
  }

  const missingRequired: string[] = [];
  if (map.title == null) missingRequired.push("title (or event / event name / name)");
  if (map.startDate == null) {
    missingRequired.push("start date (or date / event date / from date)");
  }

  return { map, missingRequired, normalizedHeaders };
}

export function cellAt(row: unknown[], index: number | undefined): unknown {
  if (index == null) return null;
  return row[index] ?? null;
}

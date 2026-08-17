import { google } from "googleapis";
import { createHash } from "crypto";
import {
  compareEventsByStart,
  parseSheetDate,
  parseSheetTime,
} from "@/lib/calendar/dateUtils";
import {
  buildColumnMap,
  cellAt,
  type ColumnMap,
} from "@/lib/calendar/headerMapping";
import type {
  CalendarConnectionStatus,
  CalendarEvent,
  CalendarEventStatus,
  CalendarSheetResult,
  CalendarValidationWarning,
} from "@/lib/calendar/types";

const DEFAULT_SHEET_ID = "1joCauwV7mPztYtFkLDwE126NHEYgnibCLFFQUq09_7E";

export class CalendarConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarConfigError";
  }
}

export class CalendarAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarAccessError";
  }
}

function getSpreadsheetId(): string {
  return (
    process.env.GOOGLE_CALENDAR_SHEET_ID?.trim() || DEFAULT_SHEET_ID
  );
}

function getCacheSeconds(): number {
  const raw = Number(process.env.CALENDAR_CACHE_SECONDS ?? "300");
  return Number.isFinite(raw) && raw > 0 ? raw : 300;
}

function getServiceAccountCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (!email || !privateKey) {
    throw new CalendarConfigError(
      "Google Calendar credentials are missing. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in .env.",
    );
  }

  return { email, privateKey };
}

function createSheetsClient() {
  const { email, privateKey } = getServiceAccountCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

function spreadsheetUrl(id: string): string {
  return `https://docs.google.com/spreadsheets/d/${id}/edit?gid=0#gid=0`;
}

function parseStatus(value: unknown): CalendarEventStatus {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw.includes("cancel")) return "cancelled";
  if (raw.includes("postpone")) return "postponed";
  if (raw.includes("complete") || raw.includes("done")) return "completed";
  return "scheduled";
}

function parseAllDay(value: unknown, startTime: string | null): boolean {
  if (value == null || value === "") return !startTime;
  const raw = String(value).trim().toLowerCase();
  if (["true", "yes", "y", "1", "all day", "allday"].includes(raw)) return true;
  if (["false", "no", "n", "0"].includes(raw)) return false;
  return !startTime;
}

function stableEventId(row: number, title: string, startDate: string): string {
  return createHash("sha1")
    .update(`${row}|${title}|${startDate}`)
    .digest("hex")
    .slice(0, 16);
}

function textOrNull(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function rowToEvent(
  row: unknown[],
  map: ColumnMap,
  sourceRow: number,
): { event?: CalendarEvent; warning?: CalendarValidationWarning } {
  const isEmpty = row.every(
    (cell) => cell == null || String(cell).trim() === "",
  );
  if (isEmpty) return {};

  const title = textOrNull(cellAt(row, map.title));
  const startDate = parseSheetDate(cellAt(row, map.startDate));

  if (!title || !startDate) {
    return {
      warning: {
        row: sourceRow,
        message: !title
          ? "Missing title"
          : "Missing or invalid start date",
      },
    };
  }

  const startTime = parseSheetTime(cellAt(row, map.startTime));
  const endTime = parseSheetTime(cellAt(row, map.endTime));
  const endDate = parseSheetDate(cellAt(row, map.endDate));
  const allDay = parseAllDay(cellAt(row, map.allDay), startTime);

  const event: CalendarEvent = {
    id: stableEventId(sourceRow, title, startDate),
    title,
    description: textOrNull(cellAt(row, map.description)),
    startDate,
    endDate,
    startTime: allDay ? null : startTime,
    endTime: allDay ? null : endTime,
    location: textOrNull(cellAt(row, map.location)),
    category: textOrNull(cellAt(row, map.category)),
    department: textOrNull(cellAt(row, map.department)),
    organiser: textOrNull(cellAt(row, map.organiser)),
    contactEmail: textOrNull(cellAt(row, map.contactEmail)),
    registrationUrl: textOrNull(cellAt(row, map.registrationUrl)),
    imageUrl: textOrNull(cellAt(row, map.imageUrl)),
    status: parseStatus(cellAt(row, map.status)),
    allDay,
    sourceRow,
  };

  return { event };
}

type CacheEntry = {
  expiresAt: number;
  value: CalendarSheetResult;
};

let memoryCache: CacheEntry | null = null;

export function clearCalendarCache() {
  memoryCache = null;
}

async function fetchSheetRows(): Promise<{
  values: unknown[][];
  sheetTitle: string;
  spreadsheetId: string;
}> {
  const spreadsheetId = getSpreadsheetId();
  const configuredName = process.env.GOOGLE_CALENDAR_SHEET_NAME?.trim();

  try {
    const sheets = createSheetsClient();
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties(title,sheetId,index)",
    });

    const sheetProps = meta.data.sheets ?? [];
    if (sheetProps.length === 0) {
      throw new CalendarAccessError("The spreadsheet has no worksheets.");
    }

    let sheetTitle = sheetProps[0]?.properties?.title ?? "Sheet1";
    if (configuredName) {
      const match = sheetProps.find(
        (s) => s.properties?.title?.toLowerCase() === configuredName.toLowerCase(),
      );
      if (!match?.properties?.title) {
        throw new CalendarAccessError(
          `Worksheet "${configuredName}" was not found in the spreadsheet.`,
        );
      }
      sheetTitle = match.properties.title;
    }

    const range = `'${sheetTitle.replace(/'/g, "''")}'`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "SERIAL_NUMBER",
    });

    return {
      values: (response.data.values as unknown[][]) ?? [],
      sheetTitle,
      spreadsheetId,
    };
  } catch (error) {
    if (
      error instanceof CalendarConfigError ||
      error instanceof CalendarAccessError
    ) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    if (/permission|forbidden|403/i.test(message)) {
      throw new CalendarAccessError(
        "The service account cannot access this spreadsheet. Share it with Viewer access.",
      );
    }
    if (/not found|404/i.test(message)) {
      throw new CalendarAccessError("Spreadsheet not found. Check GOOGLE_CALENDAR_SHEET_ID.");
    }
    if (/API has not been used|accessNotConfigured|sheets.googleapis.com/i.test(message)) {
      throw new CalendarAccessError(
        "Google Sheets API is not enabled for this Google Cloud project.",
      );
    }
    if (/DECODER|PEM|private key|invalid_grant/i.test(message)) {
      throw new CalendarConfigError(
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is invalid. Ensure newlines are escaped as \\n.",
      );
    }
    if (/quota|rate limit|429/i.test(message)) {
      throw new CalendarAccessError(
        "Google Sheets API rate limit reached. Try again shortly.",
      );
    }

    console.error("Google Sheets calendar fetch failed:", message);
    throw new CalendarAccessError(
      "Unable to read the company calendar from Google Sheets.",
    );
  }
}

export async function readCalendarSheet(
  options: { bypassCache?: boolean } = {},
): Promise<CalendarSheetResult> {
  const now = Date.now();
  if (!options.bypassCache && memoryCache && memoryCache.expiresAt > now) {
    return memoryCache.value;
  }

  const { values, sheetTitle, spreadsheetId } = await fetchSheetRows();

  if (values.length === 0) {
    throw new CalendarAccessError("The company calendar spreadsheet is empty.");
  }

  const [headerRow, ...dataRows] = values;
  const headers = (headerRow ?? []).map((h) => String(h ?? ""));
  const { map, missingRequired } = buildColumnMap(headers);

  if (missingRequired.length > 0) {
    throw new CalendarConfigError(
      `Calendar spreadsheet is missing required columns: ${missingRequired.join("; ")}.`,
    );
  }

  const events: CalendarEvent[] = [];
  const invalidRows: CalendarValidationWarning[] = [];

  dataRows.forEach((row, index) => {
    const sourceRow = index + 2; // 1-based + header
    const { event, warning } = rowToEvent(row ?? [], map, sourceRow);
    if (warning) {
      invalidRows.push(warning);
      console.warn(
        `[calendar] Invalid row ${warning.row}: ${warning.message}`,
      );
      return;
    }
    if (event) events.push(event);
  });

  events.sort(compareEventsByStart);

  const result: CalendarSheetResult = {
    events,
    invalidRows,
    sheetTitle,
    spreadsheetId,
    syncedAt: new Date().toISOString(),
  };

  memoryCache = {
    expiresAt: now + getCacheSeconds() * 1000,
    value: result,
  };

  return result;
}

export async function getCalendarConnectionStatus(): Promise<CalendarConnectionStatus> {
  const spreadsheetId = getSpreadsheetId();
  const base = {
    spreadsheetId,
    spreadsheetUrl: spreadsheetUrl(spreadsheetId),
    missingHeaders: [] as string[],
  };

  try {
    const result = await readCalendarSheet({ bypassCache: true });
    return {
      ...base,
      connected: true,
      sheetTitle: result.sheetTitle,
      lastSuccessAt: result.syncedAt,
      validEventCount: result.events.length,
      invalidRowCount: result.invalidRows.length,
      warnings: result.invalidRows,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to connect to the Google Sheet.";

    let missingHeaders: string[] = [];
    if (error instanceof CalendarConfigError && message.includes("missing required columns")) {
      missingHeaders = message
        .replace(/^.*missing required columns:\s*/i, "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return {
      ...base,
      connected: false,
      sheetTitle: null,
      lastSuccessAt: memoryCache?.value.syncedAt ?? null,
      validEventCount: memoryCache?.value.events.length ?? 0,
      invalidRowCount: memoryCache?.value.invalidRows.length ?? 0,
      warnings: memoryCache?.value.invalidRows ?? [],
      missingHeaders,
      error: message,
    };
  }
}

export function employeeCalendarErrorMessage(): string {
  return "The company calendar is temporarily unavailable. Please try again shortly.";
}

// TODO: Add a Google Apps Script webhook or scheduled sync job for near-real-time updates.

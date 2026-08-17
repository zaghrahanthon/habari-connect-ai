export type CalendarEventStatus =
  | "scheduled"
  | "cancelled"
  | "postponed"
  | "completed";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  category: string | null;
  department: string | null;
  organiser: string | null;
  contactEmail: string | null;
  registrationUrl: string | null;
  imageUrl: string | null;
  status: CalendarEventStatus;
  allDay: boolean;
  sourceRow: number;
};

export type CalendarValidationWarning = {
  row: number;
  message: string;
};

export type CalendarSheetResult = {
  events: CalendarEvent[];
  invalidRows: CalendarValidationWarning[];
  sheetTitle: string;
  spreadsheetId: string;
  syncedAt: string;
};

export type CalendarConnectionStatus = {
  connected: boolean;
  spreadsheetId: string;
  sheetTitle: string | null;
  lastSuccessAt: string | null;
  validEventCount: number;
  invalidRowCount: number;
  warnings: CalendarValidationWarning[];
  missingHeaders: string[];
  error: string | null;
  spreadsheetUrl: string;
};

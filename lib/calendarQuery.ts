import { todayDateString } from "@/lib/calendar/dateUtils";
import {
  filterCalendarEvents,
  formatEventsForAi,
  isCalendarQuestion,
  selectEventsForAiQuestion,
  type CalendarQuery,
} from "@/lib/calendar/filters";
import {
  employeeCalendarErrorMessage,
  readCalendarSheet,
} from "@/lib/googleSheetsCalendar";

export type { CalendarQuery, CalendarView } from "@/lib/calendar/filters";
export {
  filterCalendarEvents,
  formatEventsForAi,
  getEventsForDate,
  getEventsForDateRange,
  getNextEvent,
  getUpcomingEvents,
  isCalendarQuestion,
  searchCalendarEvents,
  selectEventsForAiQuestion,
} from "@/lib/calendar/filters";

export async function getCalendarEvents(query: CalendarQuery = {}) {
  const sheet = await readCalendarSheet();
  return {
    events: filterCalendarEvents(sheet.events, query),
    syncedAt: sheet.syncedAt,
    sheetTitle: sheet.sheetTitle,
    spreadsheetId: sheet.spreadsheetId,
    totalValid: sheet.events.length,
    invalidRowCount: sheet.invalidRows.length,
    warnings: sheet.invalidRows,
  };
}

export async function getCalendarContextForChat(question: string): Promise<{
  relevant: boolean;
  context: string;
}> {
  if (!isCalendarQuestion(question)) {
    return { relevant: false, context: "" };
  }

  try {
    const sheet = await readCalendarSheet();
    const selected = selectEventsForAiQuestion(sheet.events, question);
    const today = todayDateString();
    const context = [
      "## Live Habari company calendar (Google Sheet source of truth)",
      `Timezone: Africa/Johannesburg`,
      `Current date: ${today}`,
      `Last synced: ${sheet.syncedAt}`,
      `Source: Habari Company Calendar`,
      "",
      formatEventsForAi(selected),
    ].join("\n");

    return { relevant: true, context };
  } catch (error) {
    console.error("Calendar context for chat failed:", error);
    return {
      relevant: true,
      context: [
        "## Live Habari company calendar",
        employeeCalendarErrorMessage(),
        "Do not invent events. Tell the employee the calendar is temporarily unavailable.",
      ].join("\n"),
    };
  }
}

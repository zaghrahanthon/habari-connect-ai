import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  CalendarAccessError,
  CalendarConfigError,
  clearCalendarCache,
  employeeCalendarErrorMessage,
} from "@/lib/googleSheetsCalendar";
import { getCalendarEvents, type CalendarView } from "@/lib/calendarQuery";
import { requireOfficeNetwork } from "@/lib/networkAccess";

export const dynamic = "force-dynamic";

/**
 * Employee calendar feed — office-network only, no employee login.
 * When an admin session exists, validation warnings are included.
 */
export async function GET(request: Request) {
  const office = await requireOfficeNetwork("/api/calendar/events");
  if (office.error) return office.error;

  const session = await getServerSession(authOptions);

  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "1";
    if (refresh) clearCalendarCache();

    const view = (searchParams.get("view") as CalendarView | null) ?? "upcoming";
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;

    const result = await getCalendarEvents({
      view: ["upcoming", "past", "all"].includes(view) ? view : "upcoming",
      date: searchParams.get("date") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      department: searchParams.get("department") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
      includeCancelled: searchParams.get("includeCancelled") === "1",
    });

    const isAdmin = session?.user?.role === "admin";

    return NextResponse.json({
      events: result.events,
      syncedAt: result.syncedAt,
      sheetTitle: result.sheetTitle,
      count: result.events.length,
      ...(isAdmin
        ? {
            warnings: result.warnings,
            invalidRowCount: result.invalidRowCount,
            totalValid: result.totalValid,
          }
        : {}),
    });
  } catch (error) {
    console.error("GET /api/calendar/events failed:", error);

    if (
      error instanceof CalendarConfigError ||
      error instanceof CalendarAccessError
    ) {
      return NextResponse.json(
        {
          error: employeeCalendarErrorMessage(),
          ...(session?.user?.role === "admin" ? { detail: error.message } : {}),
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: employeeCalendarErrorMessage() },
      { status: 503 },
    );
  }
}

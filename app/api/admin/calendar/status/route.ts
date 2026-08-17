import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  clearCalendarCache,
  getCalendarConnectionStatus,
} from "@/lib/googleSheetsCalendar";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("refresh") === "1") {
    clearCalendarCache();
  }

  const status = await getCalendarConnectionStatus();
  return NextResponse.json(status);
}

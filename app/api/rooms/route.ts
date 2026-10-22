import { NextResponse } from "next/server";
import { requireBookingSession } from "@/lib/bookings/access";
import { getActiveRooms } from "@/lib/bookings/service";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  const { error } = await requireBookingSession("/api/rooms");
  if (error) return error;

  try {
    const rooms = await getActiveRooms();
    return NextResponse.json(rooms);
  } catch (e) {
    return handleApiError(e, "Failed to load rooms");
  }
}

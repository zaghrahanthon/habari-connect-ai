import { requireAuth } from "@/lib/auth-guards";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import type { Session } from "next-auth";
import type { NextResponse } from "next/server";

export async function requireBookingSession(route: string): Promise<{
  session: Session | null;
  error: NextResponse | null;
}> {
  const office = await requireOfficeNetwork(route);
  if (office.error) {
    return { session: null, error: office.error };
  }

  return requireAuth();
}

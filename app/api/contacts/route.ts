import { NextResponse } from "next/server";
import { searchPublishedContacts } from "@/lib/employee-content";
import { requireOfficeNetwork } from "@/lib/networkAccess";

export async function GET(request: Request) {
  const office = await requireOfficeNetwork("/api/contacts");
  if (office.error) return office.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const contacts = await searchPublishedContacts(q);
  return NextResponse.json(contacts, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

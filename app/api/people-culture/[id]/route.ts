import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { toPublicPeopleProfile } from "@/lib/peopleHelpers";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const office = await requireOfficeNetwork("/api/people-culture/[id]");
  if (office.error) return office.error;

  try {
    const { id } = await params;
    const profile = await prisma.peopleProfile.findFirst({
      where: { id, isPublished: true },
    });
    if (!profile) return jsonError("Not found", 404);

    return NextResponse.json(toPublicPeopleProfile(profile), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

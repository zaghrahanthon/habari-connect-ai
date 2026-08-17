import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { prisma } from "@/lib/prisma";
import { peopleProfileSchema } from "@/lib/validations/admin";
import { toPeopleProfileData } from "@/lib/peopleProfileData";
import { deletePeopleImageIfUnused } from "@/lib/peopleImageStorage";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const office = await requireOfficeNetwork("/api/admin/people-culture/[id]");
  if (office.error) return office.error;

  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const profile = await prisma.peopleProfile.findUnique({ where: { id } });
    if (!profile) return jsonError("Not found", 404);
    return NextResponse.json(profile, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const office = await requireOfficeNetwork("/api/admin/people-culture/[id]");
  if (office.error) return office.error;

  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await prisma.peopleProfile.findUnique({ where: { id } });
    if (!existing) return jsonError("Not found", 404);

    const data = peopleProfileSchema.parse(await request.json());
    const next = toPeopleProfileData(data);

    const profile = await prisma.peopleProfile.update({
      where: { id },
      data: next,
    });

    if (existing.imageUrl && existing.imageUrl !== next.imageUrl) {
      await deletePeopleImageIfUnused(existing.imageUrl, id);
    }

    return NextResponse.json(profile);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const office = await requireOfficeNetwork("/api/admin/people-culture/[id]");
  if (office.error) return office.error;

  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await prisma.peopleProfile.findUnique({ where: { id } });
    if (!existing) return jsonError("Not found", 404);

    await prisma.peopleProfile.delete({ where: { id } });
    await deletePeopleImageIfUnused(existing.imageUrl);

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parseResourcePayload } from "@/lib/resource-utils";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const data = await parseResourcePayload(await request.json());
    const item = await prisma.resource.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.resource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const item = await prisma.resource.findUnique({ where: { id } });
    if (!item) return jsonError("Not found", 404);
    return NextResponse.json(item);
  } catch (e) {
    return handleApiError(e);
  }
}

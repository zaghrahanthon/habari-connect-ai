import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sectionSchema } from "@/lib/validations/admin";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { revalidateByCategory } from "@/lib/adminRevalidate";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const data = sectionSchema.parse(await request.json());
    const item = await prisma.sectionItem.update({ where: { id }, data });
    revalidateByCategory(item.category);
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
    const existing = await prisma.sectionItem.findUnique({ where: { id } });
    await prisma.sectionItem.delete({ where: { id } });
    if (existing) revalidateByCategory(existing.category);
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
    const item = await prisma.sectionItem.findUnique({ where: { id } });
    if (!item) return jsonError("Not found", 404);
    return NextResponse.json(item);
  } catch (e) {
    return handleApiError(e);
  }
}

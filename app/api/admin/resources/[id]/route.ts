import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { indexResourceTextInBackground, parseResourcePayload } from "@/lib/resource-utils";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { revalidateByCategory } from "@/lib/adminRevalidate";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const data = await parseResourcePayload(await request.json());
    const existing = await prisma.resource.findUnique({ where: { id } });
    const fileChanged = Boolean(data.fileUrl && data.fileUrl !== existing?.fileUrl);
    const item = await prisma.resource.update({
      where: { id },
      data: fileChanged ? { ...data, extractedText: null } : data,
    });
    if (fileChanged || !item.extractedText) {
      indexResourceTextInBackground(item.id, item.fileUrl);
    }
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
    const existing = await prisma.resource.findUnique({ where: { id } });
    await prisma.resource.delete({ where: { id } });
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
    const item = await prisma.resource.findUnique({ where: { id } });
    if (!item) return jsonError("Not found", 404);
    return NextResponse.json(item);
  } catch (e) {
    return handleApiError(e);
  }
}

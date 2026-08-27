import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { knowledgeSchema } from "@/lib/validations/admin";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { revalidateByCategory } from "@/lib/adminRevalidate";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const item = await prisma.knowledgeItem.findUnique({ where: { id } });
    if (!item) return jsonError("Not found", 404);
    return NextResponse.json(item);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const data = knowledgeSchema.parse(body);

    const item = await prisma.knowledgeItem.update({
      where: { id },
      data: {
        ...data,
        sourceUrl: data.sourceUrl || null,
        updatedById: session!.user.id,
      },
    });

    revalidateByCategory(item.category);
    return NextResponse.json(item);
  } catch (e) {
    return handleApiError(e, "Failed to update knowledge item");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await prisma.knowledgeItem.findUnique({ where: { id } });
    await prisma.knowledgeItem.delete({ where: { id } });
    if (existing) revalidateByCategory(existing.category);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e, "Failed to delete knowledge item");
  }
}

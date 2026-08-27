import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { newsSchema } from "@/lib/validations/admin";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { revalidateEmployeeSection } from "@/lib/adminRevalidate";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const data = newsSchema.parse(await request.json());
    const post = await prisma.newsPost.update({ where: { id }, data });
    revalidateEmployeeSection("news");
    return NextResponse.json(post);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.newsPost.delete({ where: { id } });
    revalidateEmployeeSection("news");
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
    const post = await prisma.newsPost.findUnique({ where: { id } });
    if (!post) return jsonError("Not found", 404);
    return NextResponse.json(post);
  } catch (e) {
    return handleApiError(e);
  }
}

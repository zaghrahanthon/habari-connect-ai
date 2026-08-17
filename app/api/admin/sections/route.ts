import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sectionSchema } from "@/lib/validations/admin";
import { handleApiError } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const items = await prisma.sectionItem.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(items);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const data = sectionSchema.parse(await request.json());
    const item = await prisma.sectionItem.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

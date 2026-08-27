import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { knowledgeSchema } from "@/lib/validations/admin";
import { handleApiError } from "@/lib/api-utils";
import { revalidateByCategory } from "@/lib/adminRevalidate";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const items = await prisma.knowledgeItem.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (e) {
    return handleApiError(e, "Failed to fetch knowledge items");
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = knowledgeSchema.parse(body);

    const item = await prisma.knowledgeItem.create({
      data: {
        ...data,
        sourceUrl: data.sourceUrl || null,
        createdById: session!.user.id,
        updatedById: session!.user.id,
      },
    });

    revalidateByCategory(item.category);
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return handleApiError(e, "Failed to create knowledge item");
  }
}

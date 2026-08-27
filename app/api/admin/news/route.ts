import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { newsSchema } from "@/lib/validations/admin";
import { handleApiError } from "@/lib/api-utils";
import { revalidateEmployeeSection } from "@/lib/adminRevalidate";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const posts = await prisma.newsPost.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(posts);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const data = newsSchema.parse(await request.json());
    const post = await prisma.newsPost.create({ data });
    revalidateEmployeeSection("news");
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

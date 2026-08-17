import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const [
      knowledgeCount,
      publishedSections,
      resourcesCount,
      newsCount,
      contactsCount,
      usersCount,
    ] = await Promise.all([
      prisma.knowledgeItem.count(),
      prisma.sectionItem.count({ where: { isPublished: true } }),
      prisma.resource.count(),
      prisma.newsPost.count({ where: { isPublished: true } }),
      prisma.quickContact.count({ where: { isPublished: true } }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      knowledgeCount,
      publishedSections,
      resourcesCount,
      newsCount,
      contactsCount,
      usersCount,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

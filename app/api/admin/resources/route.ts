import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { indexResourceTextInBackground, parseResourcePayload } from "@/lib/resource-utils";
import { handleApiError } from "@/lib/api-utils";
import { revalidateByCategory } from "@/lib/adminRevalidate";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const items = await prisma.resource.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json(items);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = await parseResourcePayload(body);
    const item = await prisma.resource.create({ data });
    indexResourceTextInBackground(item.id, item.fileUrl);
    revalidateByCategory(item.category);
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return handleApiError(e, "Failed to create resource");
  }
}

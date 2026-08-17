import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations/admin";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const contacts = await prisma.quickContact.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(contacts);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const data = contactSchema.parse(await request.json());
    const contact = await prisma.quickContact.create({
      data: { ...data, email: data.email || null },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

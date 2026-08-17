import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations/admin";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const data = contactSchema.parse(await request.json());
    const contact = await prisma.quickContact.update({
      where: { id },
      data: { ...data, email: data.email || null },
    });
    return NextResponse.json(contact);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.quickContact.delete({ where: { id } });
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
    const contact = await prisma.quickContact.findUnique({ where: { id } });
    if (!contact) return jsonError("Not found", 404);
    return NextResponse.json(contact);
  } catch (e) {
    return handleApiError(e);
  }
}

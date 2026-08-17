import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validations/admin";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;

    // Prevent admin from disabling themselves
    if (id === session!.user.id) {
      const body = await request.json();
      if (body.isActive === false) {
        return jsonError("You cannot disable your own account", 400);
      }
    }

    const data = userUpdateSchema.parse(await request.json());

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(user);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
    if (!user) return jsonError("Not found", 404);
    return NextResponse.json(user);
  } catch (e) {
    return handleApiError(e);
  }
}

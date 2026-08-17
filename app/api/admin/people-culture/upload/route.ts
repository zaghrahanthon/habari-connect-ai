import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  PeopleImageValidationError,
  savePeopleImage,
} from "@/lib/peopleImageStorage";

export async function POST(request: Request) {
  const office = await requireOfficeNetwork(
    "/api/admin/people-culture/upload",
  );
  if (office.error) return office.error;

  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("No image file provided", 400);
    }

    const saved = await savePeopleImage(file);
    return NextResponse.json({
      imageUrl: saved.imageUrl,
      filename: saved.filename,
    });
  } catch (e) {
    if (e instanceof PeopleImageValidationError) {
      return jsonError(e.message, 400);
    }
    return handleApiError(e, "Image upload failed");
  }
}

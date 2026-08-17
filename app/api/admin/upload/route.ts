import { NextResponse } from "next/server";
import path from "path";
import { requireAdmin } from "@/lib/admin-auth";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { extractTextFromUpload } from "@/lib/file-extract";
import { writePrivateFile } from "@/lib/privateStorage";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".xlsx",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
];

// TODO: Production should use S3, Azure Blob Storage, or SharePoint with signed URLs

export async function POST(request: Request) {
  const office = await requireOfficeNetwork("/api/admin/upload");
  if (office.error) return office.error;

  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return jsonError("No file provided", 400);
    }

    const ext = path.extname(file.name).toLowerCase();
    if (
      !ALLOWED_EXTENSIONS.includes(ext) &&
      !ALLOWED_TYPES.includes(file.type)
    ) {
      return jsonError("File type not allowed", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const saved = await writePrivateFile(filename, buffer);

    const fileType = ext.replace(".", "") || file.type;
    const extractedText = await extractTextFromUpload(saved.fileUrl);

    return NextResponse.json({
      fileUrl: saved.fileUrl,
      fileType,
      filename: saved.filename,
      extractedText,
    });
  } catch (e) {
    return handleApiError(e, "Upload failed");
  }
}

import { NextResponse } from "next/server";
import path from "path";
import { requireAdmin } from "@/lib/admin-auth";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  writePrivateFile,
  writePrivateFileFromStream,
} from "@/lib/privateStorage";
import {
  formatUploadSize,
  isAllowedUpload,
  MAX_UPLOAD_BYTES,
} from "@/lib/uploadLimits";

export const runtime = "nodejs";
export const maxDuration = 180;

function fileTypeFromName(fileName: string, mimeType: string) {
  const ext = path.extname(fileName).toLowerCase();
  return ext.replace(".", "") || mimeType || "bin";
}

function uniqueFileName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase() || ".bin";
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}-${safeName || `upload${ext}`}`;
}

export async function POST(request: Request) {
  const office = await requireOfficeNetwork("/api/admin/upload");
  if (office.error) return office.error;

  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      return handleFormDataUpload(request);
    }

    const fromQuery = new URL(request.url).searchParams.get("filename")?.trim();
    const fromHeader = request.headers.get("x-file-name");
    let fileName = fromQuery || "upload.bin";
    if (!fromQuery && fromHeader) {
      try {
        fileName = decodeURIComponent(fromHeader).trim() || "upload.bin";
      } catch {
        fileName = fromHeader.trim() || "upload.bin";
      }
    }
    const mimeType = contentType.split(";")[0]?.trim() ?? "";
    const contentLength = Number(request.headers.get("content-length") ?? "NaN");

    if (contentLength === 0) {
      return jsonError("No file provided", 400);
    }

    if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
      return jsonError(
        `File is too large. Maximum size is ${formatUploadSize(MAX_UPLOAD_BYTES)}.`,
        413,
      );
    }

    if (!isAllowedUpload(fileName, mimeType)) {
      return jsonError("File type not allowed. Upload a PDF, Word, Excel, CSV, or image file.", 400);
    }

    if (!request.body) {
      return jsonError("No file provided", 400);
    }

    const saved = await writePrivateFileFromStream(
      uniqueFileName(fileName),
      request.body,
      MAX_UPLOAD_BYTES,
    );

    return NextResponse.json({
      fileUrl: saved.fileUrl,
      fileType: fileTypeFromName(fileName, mimeType),
      filename: saved.filename,
      extractedText: null,
    });
  } catch (e) {
    return handleUploadError(e);
  }
}

async function handleFormDataUpload(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(
      `The file could not be read. Use a PDF or document under ${formatUploadSize(MAX_UPLOAD_BYTES)}.`,
      413,
    );
  }

  const file = formData.get("file");
  if (
    !file ||
    typeof file !== "object" ||
    typeof (file as Blob).arrayBuffer !== "function" ||
    typeof (file as Blob).size !== "number" ||
    (file as Blob).size === 0
  ) {
    return jsonError("No file provided", 400);
  }

  const blob = file as Blob & { name?: string; type: string };
  const fileName = blob.name?.trim() || "upload.bin";

  if (blob.size > MAX_UPLOAD_BYTES) {
    return jsonError(
      `File is too large. Maximum size is ${formatUploadSize(MAX_UPLOAD_BYTES)}.`,
      413,
    );
  }

  if (!isAllowedUpload(fileName, blob.type)) {
    return jsonError("File type not allowed. Upload a PDF, Word, Excel, CSV, or image file.", 400);
  }

  const bytes = await blob.arrayBuffer();
  const saved = await writePrivateFile(uniqueFileName(fileName), Buffer.from(bytes));

  return NextResponse.json({
    fileUrl: saved.fileUrl,
    fileType: fileTypeFromName(fileName, blob.type),
    filename: saved.filename,
    extractedText: null,
  });
}

function handleUploadError(e: unknown) {
  console.error("Admin upload failed:", e);
  if (e instanceof Error && e.message === "FILE_TOO_LARGE") {
    return jsonError(
      `File is too large. Maximum size is ${formatUploadSize(MAX_UPLOAD_BYTES)}.`,
      413,
    );
  }
  const message =
    e instanceof Error && /enospc|eacces|eperm/i.test(e.message)
      ? "The server could not save the file. Check storage permissions and disk space."
      : "Upload failed. Please try a smaller PDF or try again.";
  return handleApiError(e, message);
}

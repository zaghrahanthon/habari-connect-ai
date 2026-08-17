import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

/** Private employee documents — not served from /public. */
export const PRIVATE_STORAGE_DIR = path.join(process.cwd(), "storage", "private");

// TODO: Production object storage with signed URLs and access controls (S3/Azure/SharePoint).

export function isPrivateFileRef(fileUrl: string | null | undefined): boolean {
  if (!fileUrl) return false;
  return (
    fileUrl.startsWith("private/") ||
    fileUrl.startsWith("/private/") ||
    fileUrl.startsWith("/uploads/")
  );
}

export function toPrivateFileRef(filename: string): string {
  return `private/${filename}`;
}

function safeBasename(fileUrl: string): string | null {
  const base = path.basename(fileUrl);
  if (!base || base === "." || base === ".." || base.includes("..")) return null;
  return base;
}

export function resolvePrivateFilePath(fileUrl: string): string | null {
  const base = safeBasename(fileUrl);
  if (!base) return null;

  if (
    fileUrl.startsWith("private/") ||
    fileUrl.startsWith("/private/") ||
    fileUrl.startsWith("/uploads/")
  ) {
    const candidate = path.join(PRIVATE_STORAGE_DIR, base);
    if (!candidate.startsWith(PRIVATE_STORAGE_DIR)) return null;
    return candidate;
  }

  return null;
}

export async function ensurePrivateStorageDir() {
  await mkdir(PRIVATE_STORAGE_DIR, { recursive: true });
}

export async function writePrivateFile(filename: string, buffer: Buffer) {
  await ensurePrivateStorageDir();
  const safe = path.basename(filename.replace(/[^a-zA-Z0-9._-]/g, "_"));
  const filepath = path.join(PRIVATE_STORAGE_DIR, safe);
  await writeFile(filepath, buffer);
  return { filename: safe, fileUrl: toPrivateFileRef(safe), filepath };
}

export async function readPrivateFile(fileUrl: string): Promise<Buffer | null> {
  const privatePath = resolvePrivateFilePath(fileUrl);
  if (privatePath) {
    try {
      return await readFile(privatePath);
    } catch {
      // fall through to legacy
    }
  }

  const base = safeBasename(fileUrl);
  if (!base) return null;

  // Legacy public/uploads (pre-migration) — still served only via protected download route
  const legacy = path.join(process.cwd(), "public", "uploads", base);
  try {
    return await readFile(legacy);
  } catch {
    return null;
  }
}

export function mimeFromExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".csv":
      return "text/csv";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

/** Employee-facing download URL for a published resource */
export function resourceDownloadUrl(resourceId: string): string {
  return `/api/resources/${resourceId}/download`;
}

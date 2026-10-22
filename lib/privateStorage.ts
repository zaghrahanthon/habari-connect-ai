import { createWriteStream } from "fs";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";
import type { ReadableStream as NodeWebReadableStream } from "stream/web";

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

function safeStorageName(filename: string): string {
  return path.basename(filename.replace(/[^a-zA-Z0-9._-]/g, "_"));
}

export async function writePrivateFile(filename: string, buffer: Buffer) {
  await ensurePrivateStorageDir();
  const safe = safeStorageName(filename);
  const filepath = path.join(PRIVATE_STORAGE_DIR, safe);
  await writeFile(filepath, buffer);
  return { filename: safe, fileUrl: toPrivateFileRef(safe), filepath };
}

class LimitedByteStream extends Transform {
  private bytes = 0;

  constructor(private readonly maxBytes: number) {
    super();
  }

  override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: Buffer) => void,
  ) {
    this.bytes += chunk.length;
    if (this.bytes > this.maxBytes) {
      callback(new Error("FILE_TOO_LARGE"));
      return;
    }
    callback(null, chunk);
  }
}

/** Stream an upload to disk so large PDFs are not fully buffered in memory. */
export async function writePrivateFileFromStream(
  filename: string,
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
) {
  await ensurePrivateStorageDir();
  const safe = safeStorageName(filename);
  if (!safe) {
    throw new Error("Invalid filename");
  }
  const filepath = path.join(PRIVATE_STORAGE_DIR, safe);
  try {
    await pipeline(
      Readable.fromWeb(body as NodeWebReadableStream<Uint8Array>),
      new LimitedByteStream(maxBytes),
      createWriteStream(filepath),
    );
  } catch (error) {
    await unlink(filepath).catch(() => undefined);
    throw error;
  }
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

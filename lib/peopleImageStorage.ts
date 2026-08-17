import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { isPeopleImageUrl } from "@/lib/peopleHelpers";

export const PEOPLE_UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "people",
);

export const PEOPLE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PEOPLE_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const PEOPLE_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

function extensionFromMime(mime: string): string | null {
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return null;
}

/** Resolve a people image URL to an absolute path under public/uploads/people. */
export function resolvePeopleImagePath(
  imageUrl: string | null | undefined,
): string | null {
  if (!isPeopleImageUrl(imageUrl)) return null;
  const filename = path.basename(imageUrl!);
  if (
    !filename ||
    filename.includes("..") ||
    filename !== imageUrl!.replace("/uploads/people/", "")
  ) {
    return null;
  }
  const full = path.resolve(PEOPLE_UPLOAD_DIR, filename);
  if (!full.startsWith(path.resolve(PEOPLE_UPLOAD_DIR) + path.sep)) {
    return null;
  }
  return full;
}

export async function ensurePeopleUploadDir() {
  await fs.mkdir(PEOPLE_UPLOAD_DIR, { recursive: true });
}

export async function savePeopleImage(
  file: File,
): Promise<{ imageUrl: string; filename: string }> {
  const ext = path.extname(file.name).toLowerCase();
  const mime = (file.type || "").toLowerCase();

  if (!PEOPLE_IMAGE_EXTENSIONS.has(ext)) {
    throw new PeopleImageValidationError(
      "Only JPG, JPEG, PNG, and WEBP images are allowed.",
    );
  }
  if (!PEOPLE_IMAGE_MIME.has(mime)) {
    throw new PeopleImageValidationError(
      "Invalid image type. Upload a JPG, PNG, or WEBP file.",
    );
  }
  if (file.size > PEOPLE_IMAGE_MAX_BYTES) {
    throw new PeopleImageValidationError(
      "Image must be 5 MB or smaller.",
    );
  }

  const mimeExt = extensionFromMime(mime);
  const extMatchesMime =
    mimeExt === ext || (ext === ".jpeg" && mimeExt === ".jpg");
  if (!mimeExt || !extMatchesMime) {
    throw new PeopleImageValidationError(
      "File extension does not match the image type.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > PEOPLE_IMAGE_MAX_BYTES) {
    throw new PeopleImageValidationError(
      "Image must be 5 MB or smaller.",
    );
  }

  const safeExt = ext === ".jpeg" ? ".jpg" : ext;
  const filename = `${randomUUID()}${safeExt}`;
  await ensurePeopleUploadDir();
  const dest = path.join(PEOPLE_UPLOAD_DIR, filename);
  await fs.writeFile(dest, buffer);

  // TODO: Replace local storage with S3, Azure Blob Storage or another managed object-storage service before production.
  return {
    filename,
    imageUrl: `/uploads/people/${filename}`,
  };
}

export async function deletePeopleImageIfUnused(
  imageUrl: string | null | undefined,
  exceptProfileId?: string,
) {
  if (!isPeopleImageUrl(imageUrl)) return;

  const stillUsed = await prisma.peopleProfile.count({
    where: {
      imageUrl,
      ...(exceptProfileId ? { id: { not: exceptProfileId } } : {}),
    },
  });
  if (stillUsed > 0) return;

  const full = resolvePeopleImagePath(imageUrl);
  if (!full) return;

  try {
    await fs.unlink(full);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      console.error("Failed to delete people image:", error);
    }
  }
}

export class PeopleImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PeopleImageValidationError";
  }
}

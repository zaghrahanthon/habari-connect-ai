export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".xlsx",
  ".csv",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
] as const;

export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export function isAllowedUpload(fileName: string, mimeType: string): boolean {
  const ext = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`
    : "";
  if (
    (ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)
  ) {
    return true;
  }
  return (ALLOWED_UPLOAD_TYPES as readonly string[]).includes(mimeType);
}

export function formatUploadSize(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

export function uploadPercent(loaded: number, total: number): number {
  if (!Number.isFinite(loaded) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((loaded / total) * 100)));
}

export const UPLOAD_ACCEPT = [
  ...ALLOWED_UPLOAD_EXTENSIONS,
  "application/pdf",
].join(",");

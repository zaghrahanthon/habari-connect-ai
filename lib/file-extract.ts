import path from "path";
import { readPrivateFile } from "@/lib/privateStorage";

const MAX_EXTRACT_CHARS = 80_000;
const EXTRACT_TIMEOUT_MS = 20_000;

function truncate(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= MAX_EXTRACT_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_EXTRACT_CHARS)}…`;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Text extraction timed out")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return truncate(result.text ?? "");
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

/** Extract searchable text from a private/legacy uploaded file reference */
export async function extractTextFromUpload(
  fileUrl: string,
): Promise<string | null> {
  try {
    if (
      !fileUrl.startsWith("private/") &&
      !fileUrl.startsWith("/private/") &&
      !fileUrl.startsWith("/uploads/")
    ) {
      return null;
    }

    const buffer = await readPrivateFile(fileUrl);
    if (!buffer) return null;

    const ext = path.extname(fileUrl).toLowerCase();

    if (ext === ".pdf") {
      return await withTimeout(extractPdfText(buffer), EXTRACT_TIMEOUT_MS);
    }

    if (ext === ".docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return truncate(result.value ?? "");
    }

    if (ext === ".csv" || ext === ".txt") {
      return truncate(buffer.toString("utf-8"));
    }
  } catch (error) {
    console.error("Text extraction failed for", fileUrl, error);
  }

  return null;
}

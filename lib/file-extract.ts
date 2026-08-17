import path from "path";
import { readPrivateFile } from "@/lib/privateStorage";

const MAX_EXTRACT_CHARS = 80_000;

function truncate(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= MAX_EXTRACT_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_EXTRACT_CHARS)}…`;
}

/** Extract searchable text from a private/legacy uploaded file reference */
export async function extractTextFromUpload(
  fileUrl: string,
): Promise<string | null> {
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

  try {
    if (ext === ".pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return truncate(result.text ?? "");
      } finally {
        await parser.destroy();
      }
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

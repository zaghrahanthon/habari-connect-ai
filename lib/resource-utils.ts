import { extractTextFromUpload } from "@/lib/file-extract";
import { resourceSchema } from "@/lib/validations/admin";
import { z } from "zod";

type ResourceInput = z.infer<typeof resourceSchema>;

/** Parse and enrich resource payload with extracted file text when needed */
export async function parseResourcePayload(body: unknown): Promise<ResourceInput> {
  const data = resourceSchema.parse(body);

  if (data.fileUrl && !data.extractedText) {
    const extracted = await extractTextFromUpload(data.fileUrl);
    if (extracted) {
      data.extractedText = extracted;
    }
  }

  return data;
}

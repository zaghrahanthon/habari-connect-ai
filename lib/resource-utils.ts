import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTextFromUpload } from "@/lib/file-extract";
import { resourceSchema } from "@/lib/validations/admin";
import { z } from "zod";

type ResourceInput = z.infer<typeof resourceSchema>;

/** Parse resource payload without blocking on PDF text extraction. */
export async function parseResourcePayload(body: unknown): Promise<ResourceInput> {
  const data = resourceSchema.parse(body);
  if (!data.extractedText?.trim()) {
    delete data.extractedText;
  }
  return data;
}

/** Index document text after the HTTP response so uploads stay fast. */
export function indexResourceTextInBackground(resourceId: string, fileUrl: string | null | undefined) {
  if (!fileUrl) return;

  after(async () => {
    try {
      const extractedText = await extractTextFromUpload(fileUrl);
      if (!extractedText) return;
      await prisma.resource.update({
        where: { id: resourceId },
        data: { extractedText },
      });
    } catch (error) {
      console.warn("Background PDF indexing skipped:", error);
    }
  });
}

import { readFile, rm } from "fs/promises";
import { describe, expect, it } from "vitest";
import { writePrivateFileFromStream } from "@/lib/privateStorage";

function bufferStream(data: Uint8Array) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });
}

describe("writePrivateFileFromStream", () => {
  it("writes the streamed bytes to private storage", async () => {
    const payload = Buffer.from("hello-upload");
    const saved = await writePrivateFileFromStream(
      `vitest-${Date.now()}.txt`,
      bufferStream(payload),
      1024,
    );
    try {
      expect(await readFile(saved.filepath, "utf8")).toBe("hello-upload");
    } finally {
      await rm(saved.filepath, { force: true });
    }
  });

  it("rejects streams that exceed the size cap", async () => {
    await expect(
      writePrivateFileFromStream(
        `vitest-too-big-${Date.now()}.bin`,
        bufferStream(new Uint8Array(32)),
        8,
      ),
    ).rejects.toThrow("FILE_TOO_LARGE");
  });
});

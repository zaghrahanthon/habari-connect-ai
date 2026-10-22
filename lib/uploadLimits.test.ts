import { describe, expect, it } from "vitest";
import {
  formatBytes,
  isAllowedUpload,
  MAX_UPLOAD_BYTES,
  uploadPercent,
} from "@/lib/uploadLimits";

describe("upload file types", () => {
  it("allows PDFs even when the browser sends an empty MIME type", () => {
    expect(isAllowedUpload("Started form.pdf", "")).toBe(true);
    expect(isAllowedUpload("policy.PDF", "application/octet-stream")).toBe(true);
  });

  it("rejects unsupported types", () => {
    expect(isAllowedUpload("payload.exe", "application/x-msdownload")).toBe(false);
    expect(isAllowedUpload("payload.exe", "application/octet-stream")).toBe(false);
  });

  it("keeps a practical size ceiling for office documents", () => {
    expect(MAX_UPLOAD_BYTES).toBe(25 * 1024 * 1024);
  });

  it("formats byte counts for the upload progress label", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("clamps upload percent between 0 and 100", () => {
    expect(uploadPercent(0, 100)).toBe(0);
    expect(uploadPercent(51, 100)).toBe(51);
    expect(uploadPercent(100, 100)).toBe(100);
    expect(uploadPercent(150, 100)).toBe(100);
    expect(uploadPercent(10, 0)).toBe(0);
  });
});

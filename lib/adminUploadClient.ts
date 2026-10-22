import {
  formatUploadSize,
  MAX_UPLOAD_BYTES,
  uploadPercent,
} from "@/lib/uploadLimits";

export type AdminUploadResult = {
  fileUrl: string;
  fileType: string;
  filename: string;
  extractedText: string | null;
};

export type UploadProgressState = {
  loaded: number;
  total: number;
  percent: number;
  phase: "uploading" | "finishing";
};

const STALL_MS = 20_000;
const HARD_TIMEOUT_MS = 180_000;

class UploadAbortError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbortError";
  }
}

/** Upload a document with byte-level progress. fetch() cannot report this. */
export function uploadAdminFile(
  file: File,
  options: {
    onProgress?: (state: UploadProgressState) => void;
    signal?: AbortSignal;
  } = {},
): Promise<AdminUploadResult> {
  if (file.size === 0) {
    return Promise.reject(new Error("That file is empty. Choose a PDF or document to upload."));
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return Promise.reject(
      new Error(`File is too large. Maximum size is ${formatUploadSize(MAX_UPLOAD_BYTES)}.`),
    );
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    let abortReason: Error | null = null;
    let lastLoaded = 0;
    let lastProgressAt = Date.now();
    const startedAt = Date.now();

    const cleanup = () => {
      window.clearInterval(stallTimer);
      options.signal?.removeEventListener("abort", onAbort);
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const succeed = (value: AdminUploadResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const onAbort = () => {
      abortReason = new UploadAbortError("Upload cancelled.");
      xhr.abort();
    };

    const stallTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const stalledFor = Date.now() - lastProgressAt;
      if (elapsed > HARD_TIMEOUT_MS) {
        abortReason = new Error(
          "Upload timed out. Try a smaller PDF or a stronger office connection.",
        );
        xhr.abort();
        return;
      }
      if (stalledFor >= STALL_MS) {
        abortReason = new Error(
          "Upload stalled. The file is not moving — check the office network and try again.",
        );
        xhr.abort();
      }
    }, 1000);

    options.signal?.addEventListener("abort", onAbort);
    if (options.signal?.aborted) {
      onAbort();
    }

    xhr.upload.onprogress = (event) => {
      const total = event.lengthComputable && event.total > 0 ? event.total : file.size;
      const loaded = event.loaded;
      if (loaded > lastLoaded) {
        lastLoaded = loaded;
        lastProgressAt = Date.now();
      }
      options.onProgress?.({
        loaded,
        total,
        percent: uploadPercent(loaded, total),
        phase: "uploading",
      });
    };

    xhr.upload.onload = () => {
      lastProgressAt = Date.now();
      options.onProgress?.({
        loaded: file.size,
        total: file.size,
        percent: 100,
        phase: "finishing",
      });
    };

    xhr.onerror = () => {
      fail(new Error("Upload failed. Please try again."));
    };

    xhr.onabort = () => {
      fail(abortReason ?? new UploadAbortError("Upload cancelled."));
    };

    xhr.onload = () => {
      let data: {
        error?: string;
        fileUrl?: string;
        fileType?: string;
        filename?: string;
        extractedText?: string | null;
      } = {};
      try {
        data = JSON.parse(xhr.responseText || "{}") as typeof data;
      } catch {
        data = {};
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        fail(
          new Error(
            data.error ?? "Upload failed. Please try a smaller PDF or try again.",
          ),
        );
        return;
      }
      if (!data.fileUrl) {
        fail(new Error("Upload failed. The server did not return a file location."));
        return;
      }
      succeed({
        fileUrl: data.fileUrl,
        fileType: data.fileType ?? "",
        filename: data.filename ?? "",
        extractedText: data.extractedText ?? null,
      });
    };

    const url = `/api/admin/upload?filename=${encodeURIComponent(file.name)}`;
    xhr.open("POST", url);
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
}

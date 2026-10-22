"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import {
  uploadAdminFile,
  type AdminUploadResult,
  type UploadProgressState,
} from "@/lib/adminUploadClient";
import { formatBytes, UPLOAD_ACCEPT } from "@/lib/uploadLimits";
import { cn } from "@/lib/utils";

type FileUploadControlProps = {
  disabled?: boolean;
  readyHint?: string | null;
  onBusyChange?: (busy: boolean) => void;
  onError: (message: string) => void;
  onUploaded: (result: AdminUploadResult & { file: File }) => void;
};

function ProgressCircle({ percent }: { percent: number }) {
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 -rotate-90 text-accent"
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="10"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <circle
        cx="10"
        cy="10"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export default function FileUploadControl({
  disabled = false,
  readyHint,
  onBusyChange,
  onError,
  onUploaded,
}: FileUploadControlProps) {
  const abortRef = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<UploadProgressState | null>(null);

  const uploading = progress !== null;

  const startUpload = async (file: File) => {
    const controller = new AbortController();
    abortRef.current = controller;
    onError("");
    onBusyChange?.(true);
    setProgress({
      loaded: 0,
      total: file.size,
      percent: 0,
      phase: "uploading",
    });

    try {
      const result = await uploadAdminFile(file, {
        signal: controller.signal,
        onProgress: setProgress,
      });
      onUploaded({ ...result, file });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed. Please try again.";
      onError(message);
    } finally {
      setProgress(null);
      onBusyChange?.(false);
      abortRef.current = null;
    }
  };

  const label =
    progress?.phase === "finishing"
      ? "Saving file…"
      : progress
        ? `Uploading ${progress.percent}%`
        : "Choose PDF or file";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <label
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm",
            uploading || disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:bg-card-hover",
          )}
        >
          {progress ? (
            progress.percent === 0 && progress.phase === "uploading" ? (
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
            ) : (
              <ProgressCircle percent={progress.percent} />
            )
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {label}
          <input
            type="file"
            className="hidden"
            accept={UPLOAD_ACCEPT}
            disabled={uploading || disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void startUpload(file);
              event.target.value = "";
            }}
          />
        </label>
        {uploading ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="rounded-xl border border-border px-3 py-2 text-xs text-muted hover:bg-card-hover"
          >
            Cancel upload
          </button>
        ) : readyHint ? (
          <span className="text-xs text-muted">{readyHint}</span>
        ) : null}
      </div>
      {progress ? (
        <div className="max-w-md space-y-1" aria-live="polite">
          <div
            className="h-2 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
            aria-label="Upload progress"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-150"
              style={{ width: `${Math.max(progress.percent, 2)}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            {progress.phase === "finishing"
              ? "File reached the server — finishing save…"
              : `${formatBytes(progress.loaded)} of ${formatBytes(progress.total)}`}
          </p>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { RefreshCw } from "lucide-react";
import { formatDisplayDate, todayDateString } from "@/lib/calendar/dateUtils";

type CalendarStatusProps = {
  syncedAt: string | null;
  loading?: boolean;
  onRefresh: () => void;
};

export default function CalendarStatus({
  syncedAt,
  loading,
  onRefresh,
}: CalendarStatusProps) {
  const syncedLabel = syncedAt
    ? new Date(syncedAt).toLocaleString("en-ZA", {
        timeZone: "Africa/Johannesburg",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not synced yet";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-muted">
          Today · {formatDisplayDate(todayDateString())}
        </p>
        <p className="mt-1 text-xs text-muted">Last synced: {syncedLabel}</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-card-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>
  );
}

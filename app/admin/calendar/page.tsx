"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import type { CalendarConnectionStatus } from "@/lib/calendar/types";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1joCauwV7mPztYtFkLDwE126NHEYgnibCLFFQUq09_7E/edit?gid=0#gid=0";

export default function AdminCalendarPage() {
  const [status, setStatus] = useState<CalendarConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    try {
      const res = await fetch(
        refresh
          ? "/api/admin/calendar/status?refresh=1"
          : "/api/admin/calendar/status",
        { cache: "no-store" },
      );
      const data = (await res.json()) as CalendarConnectionStatus & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to load status",
        );
      }
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const boot = window.setTimeout(() => void load(false), 0);
    return () => window.clearTimeout(boot);
  }, [load]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Company Calendar
          </h1>
          <p className="text-sm text-muted">
            The Google Sheet is the source of truth. Edit events there — Habari
            Connect refreshes automatically (no redeploy).
          </p>
        </header>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Test connection / Refresh
          </button>
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-card-hover"
          >
            Open Google Sheet
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {status && (
          <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Status</p>
              <p
                className={`mt-1 text-sm font-semibold ${status.connected ? "text-emerald-300" : "text-red-300"}`}
              >
                {status.connected ? "Connected" : "Disconnected"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Worksheet
              </p>
              <p className="mt-1 text-sm text-foreground">
                {status.sheetTitle ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Spreadsheet ID
              </p>
              <p className="mt-1 break-all text-sm text-foreground">
                {status.spreadsheetId}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Last successful sync
              </p>
              <p className="mt-1 text-sm text-foreground">
                {status.lastSuccessAt
                  ? new Date(status.lastSuccessAt).toLocaleString("en-ZA", {
                      timeZone: "Africa/Johannesburg",
                    })
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Valid events
              </p>
              <p className="mt-1 text-sm text-foreground">
                {status.validEventCount}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Invalid rows
              </p>
              <p className="mt-1 text-sm text-foreground">
                {status.invalidRowCount}
              </p>
            </div>
          </div>
        )}

        {status?.error && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-medium">Connection detail</p>
            <p className="mt-1">{status.error}</p>
          </div>
        )}

        {status && status.missingHeaders.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">
              Missing required headers
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {status.missingHeaders.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {status && status.warnings.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">
              Validation warnings
            </p>
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto text-sm text-muted">
              {status.warnings.map((warning) => (
                <li key={`${warning.row}-${warning.message}`}>
                  Row {warning.row}: {warning.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 text-sm text-muted">
          <h2 className="text-base font-semibold text-foreground">
            How admins update events
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Open the Google Sheet using the button above.</li>
            <li>Add, edit, or remove event rows (keep the header row intact).</li>
            <li>
              Ensure each event has at least a title and start date. Share the
              sheet with the service account as Viewer.
            </li>
            <li>
              Within a few minutes (or after Refresh), employees see updates on{" "}
              <Link href="/dashboard/calendar" className="text-accent hover:underline">
                /dashboard/calendar
              </Link>{" "}
              and in AI chat answers.
            </li>
          </ol>
        </section>
      </div>
    </AdminShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import AdminSectionHeader from "@/components/admin/AdminSectionHeader";

type Status = {
  configured: boolean;
  connected: boolean;
  serviceAccountEmail: string | null;
  totalProperties: number;
  activeProperties: number;
  cacheSeconds: number;
};

export default function AdminAnalyticsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/analytics/status", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to load status");
    setStatus(data);
  };

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void load().catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
    }, 0);
    return () => window.clearTimeout(boot);
  }, []);

  const clearCache = async () => {
    setMessage(null);
    const res = await fetch("/api/admin/analytics/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear-cache" }),
    });
    if (res.ok) setMessage("Analytics cache cleared.");
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <AdminSectionHeader
          title="Analytics & Reports"
          description="Configure GA properties. Employees explore live website performance."
          employeePath="/dashboard/analytics"
          actions={
            <Link
              href="/admin/analytics/properties"
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
            >
              Manage properties
            </Link>
          }
        />

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 text-sm text-emerald-400">{message}</p>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted">
              Google Analytics Connection
            </p>
            <p className="mt-2 text-lg font-semibold">
              {status?.configured ? "Connected" : "Disconnected"}
            </p>
            <p className="mt-2 break-all text-xs text-muted">
              {status?.serviceAccountEmail ||
                "No service account email configured"}
            </p>
            <p className="mt-3 text-xs text-muted">
              Cache TTL: {status?.cacheSeconds ?? 900}s
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted">
              Configured Properties
            </p>
            <p className="mt-2 text-lg font-semibold">
              {status?.totalProperties ?? "—"}
            </p>
            <p className="mt-2 text-sm text-muted">
              Active: {status?.activeProperties ?? "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/admin/analytics/properties"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm text-white"
          >
            Manage Properties
          </Link>
          <button
            type="button"
            onClick={() => void clearCache()}
            className="rounded-xl border border-border px-4 py-2.5 text-sm"
          >
            Clear Cache
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-border px-4 py-2.5 text-sm"
          >
            Refresh Status
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm text-muted">
          <p className="font-medium text-foreground">Setup checklist</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Enable Google Analytics Data API in Google Cloud.</li>
            <li>
              Add the service account email as a Viewer on each GA4 property.
            </li>
            <li>
              Set credentials in <code>.env</code> (never{" "}
              <code>NEXT_PUBLIC_</code>).
            </li>
            <li>Add property IDs under Manage Properties.</li>
            <li>Use Test Connection on each property.</li>
          </ol>
        </div>
      </div>
    </AdminShell>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Copy, RefreshCw } from "lucide-react";

type StatusResponse = {
  detectedIp: string | null;
  allowed: boolean;
  environment: string;
  allowlistEntryCount: number;
  recentDenied: Array<{
    timestamp: string;
    route: string;
    referenceId: string;
    detectedIp: string | null;
  }>;
  localDevelopmentBypass: boolean;
  error?: string;
};

export default function AdminNetworkAccessPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/network-access/status", {
        cache: "no-store",
      });
      const data = (await res.json()) as StatusResponse;
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load network status");
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
    const boot = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(boot);
  }, [load]);

  const copyIp = async () => {
    if (!status?.detectedIp) return;
    await navigator.clipboard.writeText(status.detectedIp);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Network Access
          </h1>
          <p className="text-sm text-muted">
            Diagnose office public IP allowlisting. Employees must be on an
            approved public IP — not a private Wi-Fi address like 192.168.x.x.
          </p>
        </header>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh test
        </button>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {status && (
          <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted">
                Detected public IP
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="font-mono text-lg text-foreground">
                  {status.detectedIp ?? "Unable to determine"}
                </p>
                <button
                  type="button"
                  onClick={() => void copyIp()}
                  disabled={!status.detectedIp}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card-hover disabled:opacity-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy detected IP"}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Allowlist match
              </p>
              <p
                className={`mt-1 text-sm font-semibold ${status.allowed ? "text-emerald-300" : "text-red-300"}`}
              >
                {status.allowed ? "Allowed" : "Not allowed"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Environment
              </p>
              <p className="mt-1 text-sm text-foreground">{status.environment}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Allowlist entries configured
              </p>
              <p className="mt-1 text-sm text-foreground">
                {status.allowlistEntryCount}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Local development bypass
              </p>
              <p className="mt-1 text-sm text-foreground">
                {status.localDevelopmentBypass ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
        )}

        {status && status.recentDenied.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">
              Recent denied requests
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {status.recentDenied.map((row) => (
                <li
                  key={`${row.referenceId}-${row.timestamp}`}
                  className="rounded-lg border border-border bg-background px-3 py-2"
                >
                  <span className="font-mono text-foreground">
                    {row.referenceId}
                  </span>{" "}
                  · {row.route} · {row.detectedIp ?? "unknown"} ·{" "}
                  {new Date(row.timestamp).toLocaleString("en-ZA")}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 text-sm text-muted">
          <h2 className="text-base font-semibold text-foreground">
            How to update OFFICE_IP_ALLOWLIST
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Connect a computer to the office Wi-Fi (not mobile data).</li>
            <li>Open this page and copy the detected public IP.</li>
            <li>
              Add it to <code className="text-foreground">OFFICE_IP_ALLOWLIST</code>{" "}
              in production env vars (comma-separated for multiple offices).
            </li>
            <li>Redeploy / restart the app.</li>
          </ol>
          <p className="mt-3">
            Do not add private addresses such as 192.168.x.x, 10.x.x.x, or
            172.16.x.x — the app sees the office public internet IP.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}

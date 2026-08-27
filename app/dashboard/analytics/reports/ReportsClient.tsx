"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type Property = {
  id: string;
  propertyId: string;
  name: string;
  brand: string | null;
};

type SavedReport = {
  id: string;
  name: string;
  propertyId: string;
  propertyName?: string;
  brand?: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
};

const SECTIONS = [
  { id: "executiveSummary", label: "Executive Summary" },
  { id: "trafficOverview", label: "Traffic Overview" },
  { id: "trafficSources", label: "Traffic Sources" },
  { id: "topPages", label: "Top Pages" },
  { id: "audience", label: "Audience" },
  { id: "devices", label: "Devices" },
  { id: "locations", label: "Locations" },
  { id: "keyInsights", label: "Key Insights" },
  { id: "recommendations", label: "Recommendations" },
] as const;

export default function AnalyticsReportsPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [showBuilder, setShowBuilder] = useState(search.get("create") === "1");
  const [name, setName] = useState("");
  const [propertyId, setPropertyId] = useState(search.get("propertyId") ?? "");
  const [startDate, setStartDate] = useState(search.get("start") ?? "");
  const [endDate, setEndDate] = useState(search.get("end") ?? "");
  const [comparePrevious, setComparePrevious] = useState(true);
  const [sections, setSections] = useState<string[]>(SECTIONS.map((s) => s.id));
  const [generateAi, setGenerateAi] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const [propsRes, reportsRes] = await Promise.all([
      fetch("/api/analytics/properties", { cache: "no-store" }),
      fetch("/api/analytics/reports", { cache: "no-store" }),
    ]);
    const propsData = await propsRes.json();
    const reportsData = await reportsRes.json();
    const list = (propsData.properties ?? []) as Property[];
    setProperties(list);
    setPropertyId((prev) => prev || list[0]?.propertyId || "");
    setReports(reportsData.reports ?? []);
  };

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void load().catch(() => setError("Unable to load reports."));
    }, 0);
    return () => window.clearTimeout(boot);
  }, []);

  const createReport = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Analytics Report",
          propertyId,
          startDate,
          endDate,
          comparePrevious,
          sections,
          generateAi,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create report");
      router.push(`/dashboard/analytics/reports/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create report");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    await fetch(`/api/analytics/reports/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    await load();
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard/analytics"
              className="text-sm text-accent hover:text-accent-hover"
            >
              ← Analytics
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">
              Analytics Reports
            </h1>
            <p className="mt-2 text-sm text-muted">
              Create and open shared internal analytics reports.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBuilder(true)}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
          >
            Create Report
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {showBuilder ? (
          <form
            className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              void createReport();
            }}
          >
            <h2 className="text-lg font-semibold">Report builder</h2>
            <label className="block text-sm">
              Report name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
                placeholder="e.g. Joburg ETC — August Performance"
              />
            </label>
            <label className="block text-sm">
              Brand / Property
              <select
                required
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.propertyId}>
                    {p.brand || p.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Start date
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                End date
                <input
                  required
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={comparePrevious}
                onChange={(e) => setComparePrevious(e.target.checked)}
              />
              Compare with previous period
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={generateAi}
                onChange={(e) => setGenerateAi(e.target.checked)}
              />
              Generate AI analysis
            </label>
            <fieldset>
              <legend className="text-sm font-medium">Sections</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {SECTIONS.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={sections.includes(s.id)}
                      onChange={(e) => {
                        setSections((prev) =>
                          e.target.checked
                            ? [...prev, s.id]
                            : prev.filter((id) => id !== s.id),
                        );
                      }}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving ? "Generating…" : "Generate Report"}
              </button>
              <button
                type="button"
                onClick={() => setShowBuilder(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-8 space-y-3">
          {reports.length === 0 ? (
            <p className="text-sm text-muted">No saved reports yet.</p>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div>
                  <Link
                    href={`/dashboard/analytics/reports/${r.id}`}
                    className="font-medium text-foreground hover:text-accent-hover"
                  >
                    {r.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {r.brand || r.propertyName} ·{" "}
                    {String(r.startDate).slice(0, 10)} –{" "}
                    {String(r.endDate).slice(0, 10)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/analytics/reports/${r.id}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteId(r.id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete report?"
        description="Are you sure you want to delete this analytics report?"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void remove()}
      />
    </DashboardShell>
  );
}

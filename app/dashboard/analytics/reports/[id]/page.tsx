"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type ReportPayload = {
  id: string;
  name: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  aiSummary: string | null;
  reportData: {
    property?: { name?: string; brand?: string | null };
    range?: { startDate?: string; endDate?: string };
    overview?: {
      kpis?: Array<{
        label: string;
        value: number;
        changePercent: number | null;
      }>;
    };
    traffic?: {
      rows?: Array<{
        dimensions: Record<string, string>;
        metrics: Record<string, number>;
      }>;
    };
    content?: {
      rows?: Array<{
        dimensions: Record<string, string>;
        metrics: Record<string, number>;
      }>;
    };
  };
  property?: { name?: string; brand?: string | null } | null;
};

function fmt(n: number) {
  if (n > 0 && n < 1) return `${(n * 100).toFixed(1)}%`;
  return Math.round(n).toLocaleString("en-ZA");
}

export default function AnalyticsReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void fetch(`/api/analytics/reports/${params.id}`, { cache: "no-store" })
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error ?? "Not found");
          setReport(data);
        })
        .catch((err) =>
          setError(err instanceof Error ? err.message : "Not found"),
        );
    }, 0);
    return () => window.clearTimeout(boot);
  }, [params.id]);

  const duplicate = async () => {
    if (!report) return;
    const range = report.reportData.range;
    const res = await fetch("/api/analytics/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${report.name} (copy)`,
        propertyId: report.propertyId,
        startDate: range?.startDate,
        endDate: range?.endDate,
        comparePrevious: true,
        sections: [
          "executiveSummary",
          "trafficOverview",
          "trafficSources",
          "topPages",
          "audience",
          "devices",
          "locations",
          "keyInsights",
          "recommendations",
        ],
        generateAi: true,
      }),
    });
    const data = await res.json();
    if (res.ok) router.push(`/dashboard/analytics/reports/${data.id}`);
  };

  const remove = async () => {
    await fetch(`/api/analytics/reports/${params.id}`, { method: "DELETE" });
    router.push("/dashboard/analytics/reports");
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/dashboard/analytics/reports"
          className="text-sm text-accent hover:text-accent-hover"
        >
          ← Saved reports
        </Link>

        {error ? (
          <p className="mt-6 text-sm text-red-300">{error}</p>
        ) : null}

        {!report && !error ? (
          <p className="mt-6 text-sm text-muted">Loading…</p>
        ) : null}

        {report ? (
          <>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-foreground">
                  {report.name}
                </h1>
                <p className="mt-2 text-sm text-muted">
                  {report.property?.brand ||
                    report.property?.name ||
                    report.reportData.property?.brand ||
                    report.propertyId}{" "}
                  · {report.reportData.range?.startDate} –{" "}
                  {report.reportData.range?.endDate}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/analytics/reports/${report.id}/pdf`}
                  className="rounded-xl bg-accent px-4 py-2 text-sm text-white"
                >
                  Download PDF
                </a>
                <button
                  type="button"
                  onClick={() => void duplicate()}
                  className="rounded-xl border border-border px-4 py-2 text-sm"
                >
                  Duplicate Report
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-xl border border-border px-4 py-2 text-sm text-red-300"
                >
                  Delete Report
                </button>
              </div>
            </div>

            {report.aiSummary ? (
              <section className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
                  AI Analysis
                </p>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {report.aiSummary}
                </div>
              </section>
            ) : null}

            <section className="mt-8">
              <h2 className="text-lg font-semibold">KPI Overview</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(report.reportData.overview?.kpis ?? []).map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <p className="text-xs text-muted">{kpi.label}</p>
                    <p className="mt-1 text-xl font-semibold">
                      {fmt(kpi.value)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {kpi.changePercent == null
                        ? "n/a vs previous"
                        : `${kpi.changePercent > 0 ? "+" : ""}${kpi.changePercent.toFixed(1)}% vs previous`}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {(report.reportData.traffic?.rows?.length ?? 0) > 0 ? (
              <section className="mt-8">
                <h2 className="text-lg font-semibold">Traffic Sources</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {report.reportData.traffic!.rows!.slice(0, 10).map((r, i) => (
                    <li
                      key={i}
                      className="flex justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2"
                    >
                      <span>
                        {r.dimensions.sessionDefaultChannelGroup ?? "—"}
                      </span>
                      <span className="text-muted">
                        {fmt(r.metrics.sessions ?? 0)} sessions
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(report.reportData.content?.rows?.length ?? 0) > 0 ? (
              <section className="mt-8">
                <h2 className="text-lg font-semibold">Top Pages</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {report.reportData.content!.rows!.slice(0, 10).map((r, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-border bg-card px-4 py-2"
                    >
                      <p className="font-medium">
                        {r.dimensions.pageTitle || r.dimensions.pagePath}
                      </p>
                      <p className="text-xs text-muted">
                        {fmt(r.metrics.screenPageViews ?? 0)} views
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete report?"
        description="Are you sure you want to delete this analytics report?"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </DashboardShell>
  );
}

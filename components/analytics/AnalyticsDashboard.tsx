"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import AnalyticsKpiCard from "@/components/analytics/AnalyticsKpiCard";
import {
  AnalyticsTrendChart,
  ChannelChart,
  DeviceChart,
} from "@/components/analytics/AnalyticsCharts";
import {
  DATE_PRESETS,
  resolveDatePreset,
  type DatePreset,
} from "@/lib/analyticsDates";

type Property = {
  id: string;
  propertyId: string;
  name: string;
  brand: string | null;
};

type Kpi = {
  key: string;
  label: string;
  value: number;
  previous: number | null;
  changePercent: number | null;
};

type GaRow = {
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
};

type Tab = "overview" | "traffic" | "content" | "audience" | "technology";

function formatMetric(key: string, value: number): string {
  if (key === "engagementRate") return `${(value * 100).toFixed(1)}%`;
  if (key === "averageSessionDuration") {
    const mins = Math.floor(value / 60);
    const secs = Math.round(value % 60);
    return `${mins}m ${secs}s`;
  }
  return Math.round(value).toLocaleString("en-ZA");
}

function formatGaDate(raw: string): string {
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
}

export default function AnalyticsDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [preset, setPreset] = useState<DatePreset>("last30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [trendMetric, setTrendMetric] = useState<
    "sessions" | "totalUsers" | "screenPageViews"
  >("sessions");
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [trend, setTrend] = useState<GaRow[]>([]);
  const [channels, setChannels] = useState<GaRow[]>([]);
  const [pages, setPages] = useState<GaRow[]>([]);
  const [devices, setDevices] = useState<GaRow[]>([]);
  const [locations, setLocations] = useState<GaRow[]>([]);
  const [tech, setTech] = useState<GaRow[]>([]);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void fetch("/api/analytics/properties", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          const list = (data.properties ?? []) as Property[];
          setProperties(list);
          if (list[0]) setPropertyId(list[0].propertyId);
        })
        .catch(() => setError("Unable to load analytics properties."));
    }, 0);
    return () => window.clearTimeout(boot);
  }, []);

  const range = useMemo(() => {
    try {
      return resolveDatePreset(preset, {
        startDate: customStart,
        endDate: customEnd,
      });
    } catch {
      return null;
    }
  }, [preset, customStart, customEnd]);

  const loadAll = async (refresh = false) => {
    if (!propertyId || !range) {
      setError("Select a property and a valid date range.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const base = {
        propertyId,
        startDate: range.startDate,
        endDate: range.endDate,
        refresh,
      };

      const post = async (body: Record<string, unknown>) => {
        const res = await fetch("/api/analytics/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "Request failed");
        return json;
      };

      const [overview, trendData, traffic, content, audience, technology] =
        await Promise.all([
          post({ ...base, reportType: "overview" }),
          post({ ...base, reportType: "trend", trendMetric }),
          post({ ...base, reportType: "traffic" }),
          post({ ...base, reportType: "content" }),
          post({ ...base, reportType: "audience" }),
          post({ ...base, reportType: "technology" }),
        ]);

      setKpis(overview.data?.kpis ?? []);
      setTrend(trendData.data?.rows ?? []);
      setChannels(traffic.data?.rows ?? []);
      setPages(content.data?.rows ?? []);
      setLocations(audience.data?.rows ?? []);
      setTech(technology.data?.rows ?? []);

      const byDevice = new Map<string, number>();
      for (const row of (technology.data?.rows ?? []) as GaRow[]) {
        const device = row.dimensions.deviceCategory || "Unknown";
        byDevice.set(
          device,
          (byDevice.get(device) ?? 0) + (row.metrics.totalUsers ?? 0),
        );
      }
      setDevices(
        [...byDevice.entries()].map(([device, totalUsers]) => ({
          dimensions: { deviceCategory: device },
          metrics: { totalUsers },
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Analytics data is temporarily unavailable. Please try again shortly.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propertyId || !range) return;
    const boot = window.setTimeout(() => {
      void loadAll(false);
    }, 0);
    return () => window.clearTimeout(boot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, range?.startDate, range?.endDate, trendMetric]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "traffic", label: "Traffic" },
    { id: "content", label: "Content" },
    { id: "audience", label: "Audience" },
    { id: "technology", label: "Technology" },
  ];

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Analytics & Reports
            </h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Explore website performance and create professional reports.
            </p>
          </div>
          <Link
            href="/dashboard/analytics/reports"
            className="rounded-xl border border-border px-4 py-2.5 text-sm transition-colors hover:bg-card"
          >
            Saved Reports
          </Link>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">Select Website / Brand</span>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
            >
              {properties.length === 0 ? (
                <option value="">No properties configured</option>
              ) : null}
              {properties.map((p) => (
                <option key={p.id} value={p.propertyId}>
                  {p.brand || p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">Date range</span>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as DatePreset)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
            >
              {DATE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          {preset === "custom" ? (
            <>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted">Start</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted">End</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2"
                />
              </label>
            </>
          ) : null}

          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-2">
            <button
              type="button"
              onClick={() => void loadAll(false)}
              disabled={loading || !propertyId}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load Analytics"}
            </button>
            <button
              type="button"
              onClick={() => void loadAll(true)}
              disabled={loading || !propertyId}
              className="rounded-xl border border-border px-4 py-2.5 text-sm disabled:opacity-50"
            >
              Refresh
            </button>
            <Link
              href={`/dashboard/analytics/reports?create=1&propertyId=${encodeURIComponent(propertyId)}&start=${range?.startDate ?? ""}&end=${range?.endDate ?? ""}`}
              className="rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-background"
            >
              Create Report
            </Link>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {properties.length === 0 ? (
          <p className="mt-8 text-sm text-muted">
            No analytics properties are configured yet. Ask an admin to add a
            GA4 property under Admin → Analytics.
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading && kpis.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <AnalyticsKpiCard
                  key={i}
                  label="…"
                  value="—"
                  changePercent={null}
                  loading
                />
              ))
            : kpis.map((kpi) => (
                <AnalyticsKpiCard
                  key={kpi.key}
                  label={kpi.label}
                  value={formatMetric(kpi.key, kpi.value)}
                  changePercent={kpi.changePercent}
                />
              ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <section className="min-w-0 rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-foreground">Traffic Trend</h2>
              <select
                value={trendMetric}
                onChange={(e) =>
                  setTrendMetric(
                    e.target.value as
                      | "sessions"
                      | "totalUsers"
                      | "screenPageViews",
                  )
                }
                className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
              >
                <option value="sessions">Sessions</option>
                <option value="totalUsers">Users</option>
                <option value="screenPageViews">Views</option>
              </select>
            </div>
            <AnalyticsTrendChart
              labels={trend.map((r) => formatGaDate(r.dimensions.date ?? ""))}
              values={trend.map((r) => r.metrics[trendMetric] ?? 0)}
              label={trendMetric}
            />
          </section>

          <section className="min-w-0 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold text-foreground">
              Traffic Channels
            </h2>
            <ChannelChart
              labels={channels.map(
                (r) => r.dimensions.sessionDefaultChannelGroup ?? "Other",
              )}
              values={channels.map((r) => r.metrics.sessions ?? 0)}
            />
          </section>

          <section className="min-w-0 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold text-foreground">
              Device Breakdown
            </h2>
            <DeviceChart
              labels={devices.map(
                (r) => r.dimensions.deviceCategory ?? "Unknown",
              )}
              values={devices.map((r) => r.metrics.totalUsers ?? 0)}
            />
          </section>

          <section className="min-w-0 overflow-x-auto rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold text-foreground">Top Pages</h2>
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="pb-2 pr-3 font-medium">Page</th>
                  <th className="pb-2 pr-3 font-medium">Views</th>
                  <th className="pb-2 font-medium">Users</th>
                </tr>
              </thead>
              <tbody>
                {pages.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-muted">
                      No page data for this period.
                    </td>
                  </tr>
                ) : (
                  pages.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 pr-3">
                        <p className="line-clamp-1 text-foreground">
                          {row.dimensions.pageTitle || "Untitled"}
                        </p>
                        <p className="line-clamp-1 text-xs text-muted">
                          {row.dimensions.pagePath}
                        </p>
                      </td>
                      <td className="py-2 pr-3">
                        {Math.round(
                          row.metrics.screenPageViews ?? 0,
                        ).toLocaleString("en-ZA")}
                      </td>
                      <td className="py-2">
                        {Math.round(row.metrics.totalUsers ?? 0).toLocaleString(
                          "en-ZA",
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap gap-2 border-b border-border pb-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={
                  tab === t.id
                    ? "rounded-lg bg-accent/15 px-3 py-1.5 text-sm text-accent-hover"
                    : "rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-card"
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            {tab === "overview" && (
              <div className="p-6 text-sm text-muted">
                Use the KPI cards and charts above for the overview. Switch tabs
                for detailed tables, or ask Habari AI about this data in Chat.
              </div>
            )}
            {tab === "traffic" && (
              <DataTable
                headers={[
                  "Channel",
                  "Sessions",
                  "Users",
                  "Engaged Sessions",
                  "Engagement Rate",
                ]}
                rows={channels.map((r) => [
                  r.dimensions.sessionDefaultChannelGroup ?? "—",
                  Math.round(r.metrics.sessions ?? 0).toLocaleString("en-ZA"),
                  Math.round(r.metrics.totalUsers ?? 0).toLocaleString("en-ZA"),
                  Math.round(r.metrics.engagedSessions ?? 0).toLocaleString(
                    "en-ZA",
                  ),
                  `${((r.metrics.engagementRate ?? 0) * 100).toFixed(1)}%`,
                ])}
              />
            )}
            {tab === "content" && (
              <DataTable
                headers={[
                  "Page Title",
                  "Page Path",
                  "Views",
                  "Users",
                  "Avg Engagement",
                ]}
                rows={pages.map((r) => [
                  r.dimensions.pageTitle ?? "—",
                  r.dimensions.pagePath ?? "—",
                  Math.round(r.metrics.screenPageViews ?? 0).toLocaleString(
                    "en-ZA",
                  ),
                  Math.round(r.metrics.totalUsers ?? 0).toLocaleString("en-ZA"),
                  formatMetric(
                    "averageSessionDuration",
                    r.metrics.averageSessionDuration ?? 0,
                  ),
                ])}
              />
            )}
            {tab === "audience" && (
              <DataTable
                headers={["Country", "City", "Users", "Sessions"]}
                rows={locations.map((r) => [
                  r.dimensions.country ?? "—",
                  r.dimensions.city ?? "—",
                  Math.round(r.metrics.totalUsers ?? 0).toLocaleString("en-ZA"),
                  Math.round(r.metrics.sessions ?? 0).toLocaleString("en-ZA"),
                ])}
              />
            )}
            {tab === "technology" && (
              <DataTable
                headers={["Device", "Browser", "OS", "Users"]}
                rows={tech.map((r) => [
                  r.dimensions.deviceCategory ?? "—",
                  r.dimensions.browser ?? "—",
                  r.dimensions.operatingSystem ?? "—",
                  Math.round(r.metrics.totalUsers ?? 0).toLocaleString("en-ZA"),
                ])}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <table className="w-full min-w-[640px] text-left text-sm">
      <thead className="border-b border-border bg-card text-muted">
        <tr>
          {headers.map((h) => (
            <th key={h} className="px-4 py-3 font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="px-4 py-8 text-muted">
              No data for this period.
            </td>
          </tr>
        ) : (
          rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50">
              {row.map((cell, j) => (
                <td key={j} className="max-w-xs truncate px-4 py-3 text-foreground/90">
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

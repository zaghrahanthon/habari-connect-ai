"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Property = {
  propertyId: string;
  name: string;
  brand: string | null;
};

type Kpi = { key: string; label: string; value: number };

/**
 * Lazy-loading dashboard widget — only fetches after a brand is chosen.
 * Avoids expensive GA calls on every dashboard visit.
 */
export default function AnalyticsWidget() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void fetch("/api/analytics/properties", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          const list = (data.properties ?? []) as Property[];
          setProperties(list);
        })
        .catch(() => setFailed(true));
    }, 0);
    return () => window.clearTimeout(boot);
  }, []);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    const boot = window.setTimeout(() => {
      setLoading(true);
      void fetch("/api/analytics/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          startDate,
          endDate,
          reportType: "overview",
        }),
      })
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error ?? "failed");
          if (!cancelled) {
            setKpis((data.data?.kpis ?? []).slice(0, 3));
            setFailed(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFailed(true);
            setKpis([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(boot);
    };
  }, [propertyId]);

  if (failed && properties.length === 0) return null;
  if (properties.length === 0) return null;

  const fmt = (key: string, value: number) => {
    if (key === "engagementRate") return `${(value * 100).toFixed(0)}%`;
    if (value >= 1000) return `${Math.round(value / 1000)}K`;
    return Math.round(value).toLocaleString("en-ZA");
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Website Performance
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Lightweight snapshot — choose a brand to load
          </p>
        </div>
        <Link
          href="/dashboard/analytics"
          className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          Open Analytics →
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Select brand</option>
          {properties.map((p) => (
            <option key={p.propertyId} value={p.propertyId}>
              {p.brand || p.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted">Last 30 Days</span>
      </div>

      {!propertyId ? (
        <p className="mt-4 text-sm text-muted">
          Choose a brand to load a lightweight snapshot.
        </p>
      ) : loading ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-background" />
          ))}
        </div>
      ) : failed ? (
        <p className="mt-4 text-sm text-muted">
          Analytics snapshot unavailable right now.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.key}
              className="rounded-xl border border-border bg-background px-4 py-3"
            >
              <p className="text-xs text-muted">{kpi.label}</p>
              <p className="mt-1 text-lg font-semibold">
                {fmt(kpi.key, kpi.value)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

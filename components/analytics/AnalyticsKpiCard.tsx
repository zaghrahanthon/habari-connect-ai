"use client";

import { formatPercentChange } from "@/lib/analyticsDates";

type AnalyticsKpiCardProps = {
  label: string;
  value: string;
  changePercent: number | null;
  loading?: boolean;
};

export default function AnalyticsKpiCard({
  label,
  value,
  changePercent,
  loading,
}: AnalyticsKpiCardProps) {
  if (loading) {
    return <div className="h-28 animate-pulse rounded-2xl bg-card" />;
  }

  const up = changePercent != null && changePercent > 0;
  const down = changePercent != null && changePercent < 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <p
        className={
          up
            ? "mt-2 text-xs text-emerald-400"
            : down
              ? "mt-2 text-xs text-red-400"
              : "mt-2 text-xs text-muted"
        }
      >
        {formatPercentChange(changePercent)}
      </p>
    </div>
  );
}

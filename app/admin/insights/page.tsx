"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";

type InsightRow = {
  id: string;
  intent: string;
  topic: string;
  outcome: string;
  missingArea: string | null;
  count: number;
  lastSeenAt: string;
};

type InsightsPayload = {
  totals?: {
    topics: number;
    missingCompany: number;
    generalAnswers: number;
    internalAnswers: number;
  };
  couldNotAnswerConfidently?: InsightRow[];
  missingCompany?: InsightRow[];
  frequentlyAsked?: InsightRow[];
  needsClarification?: InsightRow[];
  error?: string;
};

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function TopicTable({
  rows,
  empty,
}: {
  rows: InsightRow[];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Topic</th>
            <th className="px-4 py-3 font-medium">Intent</th>
            <th className="px-4 py-3 font-medium">Times</th>
            <th className="px-4 py-3 font-medium">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/50">
              <td className="px-4 py-3 text-foreground">{row.topic}</td>
              <td className="px-4 py-3 text-muted">{row.intent.replace(/_/g, " ")}</td>
              <td className="px-4 py-3">{row.count}</td>
              <td className="px-4 py-3 text-muted">{formatWhen(row.lastSeenAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminInsightsPage() {
  const [payload, setPayload] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/insights")
      .then((response) => response.json())
      .then((data: InsightsPayload) => setPayload(data))
      .catch(() => setPayload({ error: "Could not load insights." }))
      .finally(() => setLoading(false));
  }, []);

  const totals = payload?.totals;

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-foreground">AI knowledge insights</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Aggregated topics from employee chat — not raw questions. Use this to
          fill gaps in Knowledge. Personal details are stripped before storage.
        </p>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        ) : payload?.error ? (
          <p className="mt-8 text-sm text-red-400">{payload.error}</p>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Tracked topics", value: totals?.topics ?? 0 },
                { label: "Missing company info", value: totals?.missingCompany ?? 0 },
                { label: "General AI answers", value: totals?.generalAnswers ?? 0 },
                { label: "Verified internal answers", value: totals?.internalAnswers ?? 0 },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-border bg-card px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-wide text-muted">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
                </div>
              ))}
            </div>

            <section className="mt-10 rounded-2xl border border-border bg-card">
              <header className="border-b border-border px-4 py-4">
                <h2 className="text-base font-semibold">Could not answer confidently</h2>
                <p className="mt-1 text-sm text-muted">
                  Topics answered with general guidance or marked as missing Habari information.
                </p>
              </header>
              <TopicTable
                rows={payload?.couldNotAnswerConfidently ?? []}
                empty="No low-confidence topics yet."
              />
            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card">
              <header className="border-b border-border px-4 py-4">
                <h2 className="text-base font-semibold">Missing company-specific information</h2>
                <p className="mt-1 text-sm text-muted">
                  Add a published Knowledge article so the chatbot can answer these from Habari sources.
                </p>
              </header>
              <TopicTable
                rows={payload?.missingCompany ?? []}
                empty="No missing company topics recorded."
              />
            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card">
              <header className="border-b border-border px-4 py-4">
                <h2 className="text-base font-semibold">Frequently asked</h2>
                <p className="mt-1 text-sm text-muted">
                  Recurring sanitised topics. High counts are good candidates for clearer articles.
                </p>
              </header>
              <TopicTable
                rows={payload?.frequentlyAsked ?? []}
                empty="Not enough repeat questions yet."
              />
            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card">
              <header className="border-b border-border px-4 py-4">
                <h2 className="text-base font-semibold">Articles needing clarification</h2>
                <p className="mt-1 text-sm text-muted">
                  Repeated company questions that still lack a confident internal match.
                </p>
              </header>
              <TopicTable
                rows={payload?.needsClarification ?? []}
                empty="No clarification gaps yet."
              />
            </section>
          </>
        )}
      </div>
    </AdminShell>
  );
}

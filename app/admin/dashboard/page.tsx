"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import AdminSectionCard from "@/components/admin/AdminSectionCard";
import { getAdminDashboardSections } from "@/lib/dashboardSections";
import { ExternalLink } from "lucide-react";

type SectionStatPayload = {
  key: string;
  title: string;
  adminPath: string;
  description: string;
  stats: { label: string; value: number | string }[];
};

type StatsResponse = {
  sections?: SectionStatPayload[];
  usersCount?: number;
};

export default function AdminDashboardPage() {
  const [payload, setPayload] = useState<StatsResponse | null>(null);
  const registry = getAdminDashboardSections();

  useEffect(() => {
    const id = window.setTimeout(() => {
      fetch("/api/admin/stats")
        .then((r) => r.json())
        .then(setPayload)
        .catch(console.error);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const byKey = new Map(
    (payload?.sections ?? []).map((s) => [s.key, s] as const),
  );

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Manage Habari Connect
            </h1>
            <p className="mt-2 text-muted">
              Choose a section to update. Changes you publish appear on the
              employee dashboard.
            </p>
          </div>
          <Link
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-accent/35"
          >
            View employee dashboard
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {!payload
            ? Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))
            : registry.map((section) => {
                const live = byKey.get(section.key);
                return (
                  <AdminSectionCard
                    key={section.key}
                    title={section.title}
                    description={section.description}
                    href={section.adminPath}
                    icon={section.icon}
                    stats={
                      live?.stats ?? [
                        { label: "published", value: "—" },
                        { label: "drafts", value: "—" },
                      ]
                    }
                  />
                );
              })}
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-medium text-foreground">How it works</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>Open the same section employees see.</li>
            <li>Add or edit content, then publish.</li>
            <li>
              Click <strong className="text-foreground">View employee page</strong>{" "}
              to confirm what staff will see.
            </li>
          </ol>
          {typeof payload?.usersCount === "number" ? (
            <p className="mt-4 text-xs text-muted">
              {payload.usersCount} registered admin/user accounts
            </p>
          ) : null}
        </section>
      </div>
    </AdminShell>
  );
}

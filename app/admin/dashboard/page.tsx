"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";

type Stats = {
  knowledgeCount: number;
  publishedSections: number;
  resourcesCount: number;
  newsCount: number;
  contactsCount: number;
  usersCount: number;
};

const QUICK_ACTIONS = [
  { label: "Add Knowledge Item", href: "/admin/knowledge" },
  { label: "Upload Resource", href: "/admin/resources" },
  { label: "Create News Update", href: "/admin/news" },
  { label: "Add Quick Contact", href: "/admin/contacts" },
  { label: "Manage Users", href: "/admin/users" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const cards = stats
    ? [
        { label: "Total Knowledge Items", value: stats.knowledgeCount },
        { label: "Published Sections", value: stats.publishedSections },
        { label: "Uploaded Resources", value: stats.resourcesCount },
        { label: "Latest News Posts", value: stats.newsCount },
        { label: "Quick Contacts", value: stats.contactsCount },
        { label: "Registered Users", value: stats.usersCount },
      ]
    : [];

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="mt-2 text-muted">
          Manage company knowledge, resources, news, and users.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))
            : cards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <p className="text-sm text-muted">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {card.value}
                  </p>
                </div>
              ))}
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-medium text-foreground">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-card-hover"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

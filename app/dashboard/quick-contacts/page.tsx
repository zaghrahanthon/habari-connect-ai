"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";

type Contact = {
  id: string;
  name: string;
  jobTitle: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  office: string | null;
};

export default function QuickContactsPage() {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/contacts?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then(setContacts)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/dashboard" className="text-sm text-accent hover:text-accent-hover">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">Quick Contacts</h1>
        <p className="mt-2 text-muted">Search for the right person to contact.</p>

        <input
          type="search"
          placeholder="Search by name, department, or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-6 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : contacts.length === 0 ? (
            <p className="text-muted">No contacts found.</p>
          ) : (
            contacts.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5">
                <p className="font-semibold text-foreground">{c.name}</p>
                {c.jobTitle && <p className="text-sm text-muted">{c.jobTitle}</p>}
                {c.department && <p className="text-xs text-muted">{c.department}</p>}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="mt-2 block text-sm text-accent">
                    {c.email}
                  </a>
                )}
                {c.phone && <p className="text-sm text-muted">{c.phone}</p>}
                {c.office && <p className="text-xs text-muted">{c.office}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

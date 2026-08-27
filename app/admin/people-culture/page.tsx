"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import AdminSectionHeader from "@/components/admin/AdminSectionHeader";
import { PublishBadge } from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import PeopleAvatar from "@/components/people/PeopleAvatar";
import {
  PEOPLE_DEPARTMENTS,
  PEOPLE_OFFICES,
} from "@/lib/peopleConstants";
import { fullName, initials } from "@/lib/peopleHelpers";
import { formatPeopleDate } from "@/lib/peopleHelpers";
import CategorySectionManager from "@/components/admin/CategorySectionManager";
import { Pencil, Plus, Trash2 } from "lucide-react";

type AdminPeopleProfile = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string | null;
  office: string | null;
  startDate: string | null;
  imageUrl: string | null;
  isNewStarter: boolean;
  isPublished: boolean;
};

export default function AdminPeopleCulturePage() {
  const [items, setItems] = useState<AdminPeopleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("");
  const [office, setOffice] = useState("");
  const [published, setPublished] = useState("");
  const [newStarter, setNewStarter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (department) params.set("department", department);
      if (office) params.set("office", office);
      if (published) params.set("published", published);
      if (newStarter) params.set("newStarter", newStarter);
      const res = await fetch(`/api/admin/people-culture?${params}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to load profiles",
        );
      }
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from People & Culture API");
      }
      setItems(data as AdminPeopleProfile[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(boot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, office, published, newStarter]);

  const filteredHint = useMemo(
    () => `${items.length} profile${items.length === 1 ? "" : "s"}`,
    [items.length],
  );

  const remove = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/people-culture/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setDeleteId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl">
        <AdminSectionHeader
          title="People & Culture"
          description="Meet the people behind Habari Media."
          employeePath="/dashboard/people-culture"
          actions={
            <Link
              href="/admin/people-culture/new"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Add profile
            </Link>
          }
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            placeholder="Search name, role…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load();
            }}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm lg:col-span-2"
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm"
          >
            <option value="">All departments</option>
            {PEOPLE_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={office}
            onChange={(e) => setOffice(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm"
          >
            <option value="">All offices</option>
            {PEOPLE_OFFICES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select
            value={published}
            onChange={(e) => setPublished(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
          <select
            value={newStarter}
            onChange={(e) => setNewStarter(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm lg:col-span-1"
          >
            <option value="">New starter: any</option>
            <option value="true">New starters only</option>
            <option value="false">Not new starters</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-card-hover sm:col-span-2 lg:col-span-1"
          >
            Search
          </button>
        </div>

        <p className="mt-3 text-xs text-muted">{filteredHint}</p>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border bg-card text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Office</th>
                <th className="px-4 py-3 text-left">Start date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-muted">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-muted">
                    No employee profiles yet. Add the first new starter.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PeopleAvatar
                          imageUrl={item.imageUrl}
                          initials={initials(item)}
                          alt={fullName(item)}
                          size="sm"
                          className="rounded-xl"
                        />
                        <div>
                          <p className="font-medium text-foreground">
                            {fullName(item)}
                          </p>
                          {item.isNewStarter ? (
                            <p className="text-[11px] uppercase tracking-wider text-amber-300/90">
                              New Starter
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.jobTitle}</td>
                    <td className="px-4 py-3 text-muted">
                      {item.department ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.office ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatPeopleDate(item.startDate) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PublishBadge published={item.isPublished} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/people-culture/${item.id}/edit`}
                          className="rounded-lg p-2 text-muted hover:bg-card-hover hover:text-foreground"
                          aria-label={`Edit ${fullName(item)}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteId(item.id)}
                          className="rounded-lg p-2 text-muted hover:bg-card-hover hover:text-red-400"
                          aria-label={`Delete ${fullName(item)}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete employee profile?"
        description="Are you sure you want to delete this employee profile?"
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void remove()}
      />

      <div className="mx-auto mt-12 max-w-6xl border-t border-border pt-10">
        <h2 className="text-xl font-semibold text-foreground">
          Culture & information
        </h2>
        <p className="mt-1 text-sm text-muted">
          Articles and highlighted blocks also shown on the employee People &amp;
          Culture page.
        </p>
        <div className="mt-6">
          <CategorySectionManager
            category="People & Culture"
            sectionTitle="People & Culture"
          />
        </div>
      </div>
    </AdminShell>
  );
}

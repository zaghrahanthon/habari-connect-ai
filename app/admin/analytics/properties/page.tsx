"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { PublishBadge } from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Pencil, Plus, Trash2 } from "lucide-react";

type Property = {
  id: string;
  propertyId: string;
  name: string;
  brand: string | null;
  websiteUrl: string | null;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
};

const empty = {
  propertyId: "",
  name: "",
  brand: "",
  websiteUrl: "",
  description: "",
  isActive: true,
  displayOrder: 0,
};

export default function AdminAnalyticsPropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/analytics/properties", {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to load");
    setItems(data);
  };

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void load().catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
    }, 0);
    return () => window.clearTimeout(boot);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const url = editingId
      ? `/api/admin/analytics/properties/${editingId}`
      : "/api/admin/analytics/properties";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setShowForm(false);
    setEditingId(null);
    setForm(empty);
    await load();
  };

  const edit = (item: Property) => {
    setForm({
      propertyId: item.propertyId,
      name: item.name,
      brand: item.brand ?? "",
      websiteUrl: item.websiteUrl ?? "",
      description: item.description ?? "",
      isActive: item.isActive,
      displayOrder: item.displayOrder,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const test = async (id: string) => {
    setMessage(null);
    setError(null);
    const res = await fetch(`/api/admin/analytics/properties/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Connection test failed");
      return;
    }
    setMessage(data.message ?? "Connection successful.");
  };

  const remove = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/analytics/properties/${deleteId}`, {
      method: "DELETE",
    });
    setDeleteId(null);
    await load();
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/admin/analytics" className="text-sm text-accent">
              ← Analytics
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">GA4 Properties</h1>
            <p className="mt-1 text-sm text-muted">
              Add real GA4 property IDs for Habari brands. Do not invent IDs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm(empty);
              setEditingId(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm text-white"
          >
            <Plus className="h-4 w-4" /> Add Property
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 text-sm text-emerald-400">{message}</p>
        ) : null}

        {showForm ? (
          <form
            onSubmit={save}
            className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2"
          >
            <input
              required
              placeholder="Property Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm"
            />
            <input
              required
              placeholder="GA4 Property ID (numeric)"
              value={form.propertyId}
              onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm"
            />
            <input
              placeholder="Brand"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm"
            />
            <input
              placeholder="Website URL"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm"
            />
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm sm:col-span-2"
            />
            <input
              type="number"
              placeholder="Display order"
              value={form.displayOrder}
              onChange={(e) =>
                setForm({
                  ...form,
                  displayOrder: Number(e.target.value) || 0,
                })
              }
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
              />
              Active
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-accent px-4 py-2 text-sm text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-card text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Property ID</th>
                <th className="px-4 py-3 text-left">Brand</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-muted">
                    No GA4 properties configured yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {item.propertyId}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.brand ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PublishBadge published={item.isActive} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void test(item.id)}
                          className="rounded-lg border border-border px-2 py-1 text-xs"
                        >
                          Test
                        </button>
                        <button type="button" onClick={() => edit(item)}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(item.id)}
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
        title="Delete property?"
        description="Are you sure you want to remove this GA4 property configuration?"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void remove()}
      />
    </AdminShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PublishBadge } from "@/components/admin/StatusBadge";
import { KNOWLEDGE_CATEGORIES } from "@/lib/categories";
import { Pencil, Plus, Trash2 } from "lucide-react";

type SectionItem = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  content: string | null;
  imageUrl: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
  displayOrder: number;
  isPublished: boolean;
};

const empty = {
  title: "",
  category: "Resources & Tools",
  description: "",
  content: "",
  imageUrl: "",
  buttonLabel: "",
  buttonUrl: "",
  displayOrder: 0,
  isPublished: true,
};

export default function AdminSectionsPage() {
  const [items, setItems] = useState<SectionItem[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [saveError, setSaveError] = useState("");

  const load = () =>
    fetch(`/api/admin/sections${categoryFilter ? `?category=${encodeURIComponent(categoryFilter)}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
        else setItems([]);
      });

  useEffect(() => {
    load();
  }, [categoryFilter]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    const url = editingId ? `/api/admin/sections/${editingId}` : "/api/admin/sections";
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error ?? "Save failed");
      return;
    }
    setShowForm(false);
    setEditingId(null);
    setForm(empty);
    load();
  };

  const edit = (item: SectionItem) => {
    setForm({
      title: item.title,
      category: item.category,
      description: item.description ?? "",
      content: item.content ?? "",
      imageUrl: item.imageUrl ?? "",
      buttonLabel: item.buttonLabel ?? "",
      buttonUrl: item.buttonUrl ?? "",
      displayOrder: item.displayOrder,
      isPublished: item.isPublished,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this section item?")) return;
    await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Section Management</h1>
            <p className="mt-1 text-sm text-muted">
              Text blocks and links on employee pages (About Us, Learning, etc.).{" "}
              <strong className="text-foreground">For PDFs and file uploads</strong>, use{" "}
              <a href="/admin/resources" className="text-accent hover:text-accent-hover">
                Admin → Resources
              </a>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm({ ...empty, category: categoryFilter || empty.category });
              setEditingId(null);
              setShowForm(true);
              setSaveError("");
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Add Section Item
          </button>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="mt-4 rounded-xl border border-border bg-card px-4 py-2 text-sm"
        >
          <option value="">All categories</option>
          {KNOWLEDGE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {showForm && (
          <form onSubmit={save} className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6">
            <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm">
              {KNOWLEDGE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <textarea placeholder="Content" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input placeholder="Button label" value={form.buttonLabel} onChange={(e) => setForm({ ...form, buttonLabel: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-2 text-sm" />
              <input placeholder="Button URL" value={form.buttonUrl} onChange={(e) => setForm({ ...form, buttonUrl: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            </div>
            <input type="number" placeholder="Display order" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className="w-32 rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published (required for employees to see this)</label>
            {saveError && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{saveError}</p>
            )}
            <div className="flex gap-2">
              <button type="submit" className="rounded-xl bg-accent px-4 py-2 text-sm text-white">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-4 py-2 text-sm">Cancel</button>
            </div>
          </form>
        )}

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-border bg-card text-muted">
              <tr><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-left">Category</th><th className="px-4 py-3 text-left">Order</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No section items yet. Add a text block here, or upload PDFs under{" "}
                    <a href="/admin/resources" className="text-accent hover:text-accent-hover">
                      Resources
                    </a>
                    .
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="px-4 py-3">{item.title}</td>
                  <td className="px-4 py-3 text-muted">{item.category}</td>
                  <td className="px-4 py-3">{item.displayOrder}</td>
                  <td className="px-4 py-3"><PublishBadge published={item.isPublished} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => edit(item)} className="p-2 text-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => remove(item.id)} className="p-2 text-muted hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

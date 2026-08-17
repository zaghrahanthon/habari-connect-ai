"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PublishBadge } from "@/components/admin/StatusBadge";
import { Pencil, Plus, Trash2 } from "lucide-react";

type NewsPost = {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  category: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
};

const empty = { title: "", summary: "", content: "", category: "News & Updates", coverImageUrl: "", isPublished: false };

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsPost[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => fetch("/api/admin/news").then((r) => r.json()).then(setItems);
  useEffect(() => {
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/admin/news/${editingId}` : "/api/admin/news";
    await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false); setEditingId(null); setForm(empty); load();
  };

  const edit = (item: NewsPost) => {
    setForm({ title: item.title, summary: item.summary ?? "", content: item.content, category: item.category ?? "", coverImageUrl: item.coverImageUrl ?? "", isPublished: item.isPublished });
    setEditingId(item.id); setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this news post?")) return;
    await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-between gap-4">
          <h1 className="text-2xl font-semibold">News</h1>
          <button type="button" onClick={() => { setForm(empty); setEditingId(null); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm text-white"><Plus className="h-4 w-4" /> Create News</button>
        </div>
        {showForm && (
          <form onSubmit={save} className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6">
            <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <input placeholder="Summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <textarea required rows={5} placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label>
            <div className="flex gap-2"><button type="submit" className="rounded-xl bg-accent px-4 py-2 text-sm text-white">Save</button><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-4 py-2 text-sm">Cancel</button></div>
          </form>
        )}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm"><thead className="border-b border-border bg-card text-muted"><tr><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody>{items.map((item) => (<tr key={item.id} className="border-b border-border/50"><td className="px-4 py-3">{item.title}</td><td className="px-4 py-3"><PublishBadge published={item.isPublished} /></td><td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => edit(item)}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></button></div></td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

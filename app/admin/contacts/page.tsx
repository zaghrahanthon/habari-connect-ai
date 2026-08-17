"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PublishBadge } from "@/components/admin/StatusBadge";
import { Pencil, Plus, Trash2 } from "lucide-react";

type Contact = {
  id: string;
  name: string;
  jobTitle: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  office: string | null;
  isPublished: boolean;
};

const empty = { name: "", jobTitle: "", department: "", email: "", phone: "", office: "", isPublished: true };

export default function AdminContactsPage() {
  const [items, setItems] = useState<Contact[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("");

  const load = () => fetch("/api/admin/contacts").then((r) => r.json()).then(setItems);
  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()) || (c.department ?? "").toLowerCase().includes(filter.toLowerCase()));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/admin/contacts/${editingId}` : "/api/admin/contacts";
    await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false); setEditingId(null); setForm(empty); load();
  };

  const edit = (item: Contact) => {
    setForm({ name: item.name, jobTitle: item.jobTitle ?? "", department: item.department ?? "", email: item.email ?? "", phone: item.phone ?? "", office: item.office ?? "", isPublished: item.isPublished });
    setEditingId(item.id); setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-between gap-4">
          <h1 className="text-2xl font-semibold">Quick Contacts</h1>
          <button type="button" onClick={() => { setForm(empty); setEditingId(null); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm text-white"><Plus className="h-4 w-4" /> Add Contact</button>
        </div>
        <input placeholder="Search contacts…" value={filter} onChange={(e) => setFilter(e.target.value)} className="mt-4 w-full max-w-md rounded-xl border border-border bg-card px-4 py-2 text-sm" />
        {showForm && (
          <form onSubmit={save} className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <input placeholder="Job title" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <input placeholder="Office" value={form.office} onChange={(e) => setForm({ ...form, office: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label>
            <div className="flex gap-2 sm:col-span-2"><button type="submit" className="rounded-xl bg-accent px-4 py-2 text-sm text-white">Save</button><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-4 py-2 text-sm">Cancel</button></div>
          </form>
        )}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] text-sm"><thead className="border-b border-border bg-card text-muted"><tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Department</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody>{filtered.map((item) => (<tr key={item.id} className="border-b border-border/50"><td className="px-4 py-3">{item.name}</td><td className="px-4 py-3 text-muted">{item.department}</td><td className="px-4 py-3">{item.email}</td><td className="px-4 py-3"><PublishBadge published={item.isPublished} /></td><td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => edit(item)}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></button></div></td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import AdminSectionHeader from "@/components/admin/AdminSectionHeader";
import { PublishBadge, VisibilityBadges } from "@/components/admin/StatusBadge";
import { KNOWLEDGE_CATEGORIES } from "@/lib/categories";
import { Pencil, Plus, Trash2 } from "lucide-react";
import FileUploadControl from "@/components/admin/FileUploadControl";

type Resource = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  fileUrl: string | null;
  fileType: string | null;
  extractedText: string | null;
  isPublished: boolean;
  isAiVisible: boolean;
  isEmployeeVisible: boolean;
};

const empty = {
  title: "",
  category: "Resources & Tools",
  description: "",
  fileUrl: "",
  fileType: "",
  extractedText: "",
  isPublished: true,
  isAiVisible: true,
  isEmployeeVisible: true,
};

export default function AdminResourcesPage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = () => fetch("/api/admin/resources").then((r) => r.json()).then(setItems);
  useEffect(() => {
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");

    if (!form.fileUrl) {
      setSaveError("Upload a file before saving.");
      return;
    }

    const url = editingId ? `/api/admin/resources/${editingId}` : "/api/admin/resources";
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

  const edit = (item: Resource) => {
    setForm({
      title: item.title,
      category: item.category,
      description: item.description ?? "",
      fileUrl: item.fileUrl ?? "",
      fileType: item.fileType ?? "",
      extractedText: item.extractedText ?? "",
      isPublished: item.isPublished,
      isAiVisible: item.isAiVisible,
      isEmployeeVisible: item.isEmployeeVisible,
    });
    setEditingId(item.id);
    setShowForm(true);
    setSaveError("");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    await fetch(`/api/admin/resources/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <AdminSectionHeader
            title="Resources"
            description="Find forms, policies, documents and company tools."
            employeePath="/dashboard/resources"
            className="flex-1"
            actions={
              <button
                type="button"
                onClick={() => {
                  setForm(empty);
                  setEditingId(null);
                  setShowForm(true);
                  setSaveError("");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm text-white"
              >
                <Plus className="h-4 w-4" /> Upload resource
              </button>
            }
          />
        </div>

        {showForm && (
          <form onSubmit={save} className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6">
            <input
              required
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm"
            >
              {KNOWLEDGE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm"
            />
            <FileUploadControl
              readyHint={
                form.fileUrl
                  ? `${form.fileUrl} · the chatbot will index it after you save.`
                  : null
              }
              onBusyChange={setUploading}
              onError={setSaveError}
              onUploaded={({ file, fileUrl, fileType, extractedText }) => {
                setForm((current) => ({
                  ...current,
                  fileUrl,
                  fileType: fileType || file.name.split(".").pop() || "",
                  extractedText: extractedText ?? "",
                  title: current.title || file.name.replace(/\.[^.]+$/, ""),
                }));
              }}
            />
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
                Published (required to show on employee site)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isAiVisible}
                  onChange={(e) => setForm({ ...form, isAiVisible: e.target.checked })}
                />
                Visible to AI
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isEmployeeVisible}
                  onChange={(e) => setForm({ ...form, isEmployeeVisible: e.target.checked })}
                />
                Visible to Employees
              </label>
            </div>
            {saveError && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{saveError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="rounded-xl bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
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
        )}

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-border bg-card text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="px-4 py-3">{item.title}</td>
                  <td className="px-4 py-3 text-muted">{item.category}</td>
                  <td className="px-4 py-3 text-muted">{item.fileType ?? "—"}</td>
                  <td className="px-4 py-3">
                    <PublishBadge published={item.isPublished} />
                    <VisibilityBadges
                      aiVisible={item.isAiVisible}
                      employeeVisible={item.isEmployeeVisible}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => edit(item)} className="p-2">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => remove(item.id)} className="p-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
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


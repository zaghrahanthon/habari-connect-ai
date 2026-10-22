"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PublishBadge, VisibilityBadges } from "@/components/admin/StatusBadge";
import DocumentUploadForm, {
  emptyDocumentForm,
  type DocumentFormState,
} from "@/components/admin/DocumentUploadForm";
import { KNOWLEDGE_CATEGORIES } from "@/lib/categories";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";

type KnowledgeItem = {
  id: string;
  title: string;
  category: string;
  content: string;
  sourceUrl: string | null;
  isPublished: boolean;
  isAiVisible: boolean;
  isEmployeeVisible: boolean;
};

type ResourceItem = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  fileType: string | null;
  fileUrl: string | null;
  extractedText: string | null;
  isPublished: boolean;
  isAiVisible: boolean;
  isEmployeeVisible: boolean;
};

const emptyForm = {
  title: "",
  category: KNOWLEDGE_CATEGORIES[0] as string,
  content: "",
  sourceUrl: "",
  isPublished: true,
  isAiVisible: true,
  isEmployeeVisible: true,
};

export default function AdminKnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [documents, setDocuments] = useState<ResourceItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [docForm, setDocForm] = useState<DocumentFormState>(emptyDocumentForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");

  const load = () => {
    Promise.all([
      fetch("/api/admin/knowledge").then((r) => r.json()),
      fetch("/api/admin/resources").then((r) => r.json()),
    ])
      .then(([knowledge, resources]) => {
        if (Array.isArray(knowledge)) setItems(knowledge);
        if (Array.isArray(resources)) setDocuments(resources);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter(
    (i) =>
      i.title.toLowerCase().includes(filter.toLowerCase()) ||
      i.category.toLowerCase().includes(filter.toLowerCase()),
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    const url = editingId
      ? `/api/admin/knowledge/${editingId}`
      : "/api/admin/knowledge";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error ?? "Save failed");
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    load();
  };

  const edit = (item: KnowledgeItem) => {
    setForm({
      title: item.title,
      category: item.category,
      content: item.content,
      sourceUrl: item.sourceUrl ?? "",
      isPublished: item.isPublished,
      isAiVisible: item.isAiVisible,
      isEmployeeVisible: item.isEmployeeVisible,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this knowledge item?")) return;
    await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
    load();
  };

  const editDocument = (item: ResourceItem) => {
    setDocForm({
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
    setEditingDocId(item.id);
    setShowDocForm(true);
    setShowForm(false);
  };

  const removeDocument = async (id: string) => {
    if (!confirm("Delete this PDF / document?")) return;
    await fetch(`/api/admin/resources/${id}`, { method: "DELETE" });
    load();
  };

  const filteredDocuments = documents.filter(
    (item) =>
      item.title.toLowerCase().includes(filter.toLowerCase()) ||
      item.category.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Knowledge</h1>
            <p className="mt-1 text-sm text-muted">
              Content used by the AI and employee pages.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setDocForm(emptyDocumentForm());
                setEditingDocId(null);
                setShowDocForm(true);
                setShowForm(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card-hover"
            >
              <Upload className="h-4 w-4" />
              Upload PDF
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setEditingId(null);
                setShowForm(true);
                setShowDocForm(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Add Knowledge Item
            </button>
          </div>
        </div>

        <input
          type="search"
          placeholder="Search by title or category…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mt-6 w-full max-w-md rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground"
        />

        {showDocForm && (
          <DocumentUploadForm
            form={docForm}
            setForm={setDocForm}
            editingId={editingDocId}
            onCancel={() => setShowDocForm(false)}
            onSaved={() => {
              setShowDocForm(false);
              setEditingDocId(null);
              setDocForm(emptyDocumentForm());
              load();
            }}
          />
        )}

        {showForm && (
          <form
            onSubmit={save}
            className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6"
          >
            <h2 className="font-medium text-foreground">
              {editingId ? "Edit" : "New"} Knowledge Item
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              >
                {KNOWLEDGE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              required
              rows={5}
              placeholder="Content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
            />
            <input
              placeholder="Source URL (optional)"
              value={form.sourceUrl}
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
            />
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm({ ...form, isPublished: e.target.checked })
                  }
                />
                Published
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isAiVisible}
                  onChange={(e) =>
                    setForm({ ...form, isAiVisible: e.target.checked })
                  }
                />
                Visible to AI
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isEmployeeVisible}
                  onChange={(e) =>
                    setForm({ ...form, isEmployeeVisible: e.target.checked })
                  }
                />
                Visible to Employees
              </label>
            </div>
            {saveError && (
              <p className="text-sm text-red-500">{saveError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
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
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-card text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No knowledge items yet.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-muted">{item.category}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <PublishBadge published={item.isPublished} />
                        <VisibilityBadges
                          aiVisible={item.isAiVisible}
                          employeeVisible={item.isEmployeeVisible}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => edit(item)}
                          className="rounded-lg p-2 text-muted hover:bg-card-hover hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-400"
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

        <h2 className="mt-10 text-lg font-semibold text-foreground">PDFs and documents</h2>
        <p className="mt-1 text-sm text-muted">
          Uploaded files are indexed for the chatbot when they are published and visible to AI.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-card text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No PDFs uploaded yet.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="px-4 py-3 font-medium text-foreground">{item.title}</td>
                    <td className="px-4 py-3 text-muted">{item.category}</td>
                    <td className="px-4 py-3 uppercase text-muted">{item.fileType ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <PublishBadge published={item.isPublished} />
                        <VisibilityBadges
                          aiVisible={item.isAiVisible}
                          employeeVisible={item.isEmployeeVisible}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editDocument(item)}
                          className="rounded-lg p-2 text-muted hover:bg-card-hover hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeDocument(item.id)}
                          className="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-400"
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
    </AdminShell>
  );
}

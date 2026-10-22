"use client";

import { useState } from "react";
import { KNOWLEDGE_CATEGORIES } from "@/lib/categories";
import FileUploadControl from "@/components/admin/FileUploadControl";

export type DocumentFormState = {
  title: string;
  category: string;
  description: string;
  fileUrl: string;
  fileType: string;
  extractedText: string;
  isPublished: boolean;
  isAiVisible: boolean;
  isEmployeeVisible: boolean;
};

export const emptyDocumentForm = (category = "About Us"): DocumentFormState => ({
  title: "",
  category,
  description: "",
  fileUrl: "",
  fileType: "",
  extractedText: "",
  isPublished: true,
  isAiVisible: true,
  isEmployeeVisible: true,
});

type DocumentUploadFormProps = {
  form: DocumentFormState;
  setForm: React.Dispatch<React.SetStateAction<DocumentFormState>>;
  editingId: string | null;
  onCancel: () => void;
  onSaved: () => void;
};

export default function DocumentUploadForm({
  form,
  setForm,
  editingId,
  onCancel,
  onSaved,
}: DocumentUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.fileUrl) {
      setError("Choose a PDF or file before saving.");
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/resources/${editingId}`
        : "/api/admin/resources";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      onSaved();
    } catch {
      setError("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={save}
      className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6"
    >
      <h2 className="font-medium text-foreground">Upload PDF or document</h2>
      <input
        required
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm"
      />
      <label className="block text-xs font-medium text-muted">Category</label>
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
        placeholder="Short description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm"
      />
      <FileUploadControl
        disabled={saving}
        readyHint={
          form.fileUrl
            ? `${form.title || "File ready"} · the chatbot will index it after you save.`
            : null
        }
        onBusyChange={setUploading}
        onError={setError}
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
          Published
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isAiVisible}
            onChange={(e) => setForm({ ...form, isAiVisible: e.target.checked })}
          />
          Visible to AI chatbot
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isEmployeeVisible}
            onChange={(e) =>
              setForm({ ...form, isEmployeeVisible: e.target.checked })
            }
          />
          Visible to employees
        </label>
      </div>
      {error ? (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={uploading || saving}
          className="rounded-xl bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

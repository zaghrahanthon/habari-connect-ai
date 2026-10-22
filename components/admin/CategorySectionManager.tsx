"use client";

import { useCallback, useEffect, useState } from "react";
import { PublishBadge, VisibilityBadges } from "@/components/admin/StatusBadge";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import DocumentUploadForm, {
  emptyDocumentForm,
  type DocumentFormState,
} from "@/components/admin/DocumentUploadForm";

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

type ResourceItem = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  fileType: string | null;
  isPublished: boolean;
  isAiVisible: boolean;
  isEmployeeVisible: boolean;
};

type Tab = "articles" | "blocks" | "documents";

type CategorySectionManagerProps = {
  category: string;
  sectionTitle: string;
};

const knowledgeEmpty = {
  title: "",
  content: "",
  sourceUrl: "",
  isPublished: true,
  isAiVisible: true,
  isEmployeeVisible: true,
};

const sectionEmpty = {
  title: "",
  description: "",
  content: "",
  imageUrl: "",
  buttonLabel: "",
  buttonUrl: "",
  displayOrder: 0,
  isPublished: true,
};

export default function CategorySectionManager({
  category,
  sectionTitle,
}: CategorySectionManagerProps) {
  const [tab, setTab] = useState<Tab>("articles");
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showKnowledgeForm, setShowKnowledgeForm] = useState(false);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState<string | null>(
    null,
  );
  const [knowledgeForm, setKnowledgeForm] = useState(knowledgeEmpty);

  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState(sectionEmpty);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState<DocumentFormState>(
    emptyDocumentForm(category),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [kRes, sRes, rRes] = await Promise.all([
        fetch("/api/admin/knowledge", { cache: "no-store" }),
        fetch(
          `/api/admin/sections?category=${encodeURIComponent(category)}`,
          { cache: "no-store" },
        ),
        fetch("/api/admin/resources", { cache: "no-store" }),
      ]);
      const [kData, sData, rData] = await Promise.all([
        kRes.json(),
        sRes.json(),
        rRes.json(),
      ]);
      setKnowledge(
        Array.isArray(kData)
          ? kData.filter((i: KnowledgeItem) => i.category === category)
          : [],
      );
      setSections(Array.isArray(sData) ? sData : []);
      setResources(
        Array.isArray(rData)
          ? rData.filter((i: ResourceItem) => i.category === category)
          : [],
      );
    } catch {
      setError("Could not load content for this section.");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const saveKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const url = editingKnowledgeId
      ? `/api/admin/knowledge/${editingKnowledgeId}`
      : "/api/admin/knowledge";
    const res = await fetch(url, {
      method: editingKnowledgeId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...knowledgeForm, category }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setShowKnowledgeForm(false);
    setEditingKnowledgeId(null);
    setKnowledgeForm(knowledgeEmpty);
    flash(
      knowledgeForm.isPublished
        ? "Published successfully"
        : "Changes saved as draft",
    );
    void load();
  };

  const saveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const url = editingSectionId
      ? `/api/admin/sections/${editingSectionId}`
      : "/api/admin/sections";
    const res = await fetch(url, {
      method: editingSectionId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sectionForm, category }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setShowSectionForm(false);
    setEditingSectionId(null);
    setSectionForm(sectionEmpty);
    flash(
      sectionForm.isPublished
        ? "Published successfully"
        : "Changes saved as draft",
    );
    void load();
  };

  const toggleKnowledgePublish = async (item: KnowledgeItem) => {
    await fetch(`/api/admin/knowledge/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: item.title,
        category: item.category,
        content: item.content,
        sourceUrl: item.sourceUrl ?? "",
        isPublished: !item.isPublished,
        isAiVisible: item.isAiVisible,
        isEmployeeVisible: item.isEmployeeVisible,
      }),
    });
    flash(!item.isPublished ? "Published successfully" : "Unpublished");
    void load();
  };

  const toggleSectionPublish = async (item: SectionItem) => {
    await fetch(`/api/admin/sections/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: item.title,
        category: item.category,
        description: item.description ?? "",
        content: item.content ?? "",
        imageUrl: item.imageUrl ?? "",
        buttonLabel: item.buttonLabel ?? "",
        buttonUrl: item.buttonUrl ?? "",
        displayOrder: item.displayOrder,
        isPublished: !item.isPublished,
      }),
    });
    flash(!item.isPublished ? "Published successfully" : "Unpublished");
    void load();
  };

  const moveSection = async (item: SectionItem, direction: -1 | 1) => {
    const sorted = [...sections].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    const index = sorted.findIndex((s) => s.id === item.id);
    const swap = sorted[index + direction];
    if (!swap) return;
    await Promise.all([
      fetch(`/api/admin/sections/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          category: item.category,
          description: item.description ?? "",
          content: item.content ?? "",
          imageUrl: item.imageUrl ?? "",
          buttonLabel: item.buttonLabel ?? "",
          buttonUrl: item.buttonUrl ?? "",
          displayOrder: swap.displayOrder,
          isPublished: item.isPublished,
        }),
      }),
      fetch(`/api/admin/sections/${swap.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: swap.title,
          category: swap.category,
          description: swap.description ?? "",
          content: swap.content ?? "",
          imageUrl: swap.imageUrl ?? "",
          buttonLabel: swap.buttonLabel ?? "",
          buttonUrl: swap.buttonUrl ?? "",
          displayOrder: item.displayOrder,
          isPublished: swap.isPublished,
        }),
      }),
    ]);
    flash("Order updated");
    void load();
  };

  const removeKnowledge = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
    flash("Deleted");
    void load();
  };

  const removeSection = async (id: string) => {
    if (!confirm("Delete this content block?")) return;
    await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });
    flash("Deleted");
    void load();
  };

  const publishedKnowledge = knowledge.filter((i) => i.isPublished);
  const draftKnowledge = knowledge.filter((i) => !i.isPublished);
  const publishedSections = sections.filter((i) => i.isPublished);
  const draftSections = sections.filter((i) => !i.isPublished);

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["articles", "Help articles"],
            ["blocks", "Highlighted blocks"],
            ["documents", "Documents"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              tab === id
                ? "rounded-full bg-accent/15 px-3.5 py-1.5 text-sm font-medium text-accent-hover"
                : "rounded-full border border-border px-3.5 py-1.5 text-sm text-muted hover:text-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
      ) : null}

      {!loading && tab === "articles" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Help articles
              </h2>
              <p className="text-sm text-muted">
                {publishedKnowledge.length} published · {draftKnowledge.length}{" "}
                drafts — shown on {sectionTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setKnowledgeForm(knowledgeEmpty);
                setEditingKnowledgeId(null);
                setShowKnowledgeForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Add article
            </button>
          </div>

          {showKnowledgeForm ? (
            <form
              onSubmit={saveKnowledge}
              className="space-y-3 rounded-2xl border border-border bg-card p-5"
            >
              <input
                required
                placeholder="Title"
                value={knowledgeForm.title}
                onChange={(e) =>
                  setKnowledgeForm((f) => ({ ...f, title: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
              <textarea
                required
                rows={8}
                placeholder="Content (employees see this when published)"
                value={knowledgeForm.content}
                onChange={(e) =>
                  setKnowledgeForm((f) => ({ ...f, content: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={knowledgeForm.isPublished}
                  onChange={(e) =>
                    setKnowledgeForm((f) => ({
                      ...f,
                      isPublished: e.target.checked,
                    }))
                  }
                />
                Published (visible to employees)
              </label>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={knowledgeForm.isEmployeeVisible}
                  onChange={(e) =>
                    setKnowledgeForm((f) => ({
                      ...f,
                      isEmployeeVisible: e.target.checked,
                    }))
                  }
                />
                Show on employee page
              </label>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={knowledgeForm.isAiVisible}
                  onChange={(e) =>
                    setKnowledgeForm((f) => ({
                      ...f,
                      isAiVisible: e.target.checked,
                    }))
                  }
                />
                Available to Habari AI
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowKnowledgeForm(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {knowledge.length === 0 ? (
            <EmptyAdmin
              label="Nothing has been added yet."
              actionLabel="Add first article"
              onAction={() => {
                setKnowledgeForm(knowledgeEmpty);
                setEditingKnowledgeId(null);
                setShowKnowledgeForm(true);
              }}
            />
          ) : (
            <div className="space-y-3">
              {knowledge.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {item.title}
                        </h3>
                        <PublishBadge published={item.isPublished} />
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-muted">
                        {item.content}
                      </p>
                      <div className="mt-2">
                        <VisibilityBadges
                          aiVisible={item.isAiVisible}
                          employeeVisible={item.isEmployeeVisible}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleKnowledgePublish(item)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
                      >
                        {item.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setKnowledgeForm({
                            title: item.title,
                            content: item.content,
                            sourceUrl: item.sourceUrl ?? "",
                            isPublished: item.isPublished,
                            isAiVisible: item.isAiVisible,
                            isEmployeeVisible: item.isEmployeeVisible,
                          });
                          setEditingKnowledgeId(item.id);
                          setShowKnowledgeForm(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeKnowledge(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {!loading && tab === "blocks" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Highlighted blocks
              </h2>
              <p className="text-sm text-muted">
                {publishedSections.length} published · {draftSections.length}{" "}
                drafts
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSectionForm({
                  ...sectionEmpty,
                  displayOrder: sections.length,
                });
                setEditingSectionId(null);
                setShowSectionForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Add block
            </button>
          </div>

          {showSectionForm ? (
            <form
              onSubmit={saveSection}
              className="space-y-3 rounded-2xl border border-border bg-card p-5"
            >
              <input
                required
                placeholder="Title"
                value={sectionForm.title}
                onChange={(e) =>
                  setSectionForm((f) => ({ ...f, title: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                placeholder="Short description"
                value={sectionForm.description}
                onChange={(e) =>
                  setSectionForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
              <textarea
                rows={5}
                placeholder="Body content"
                value={sectionForm.content}
                onChange={(e) =>
                  setSectionForm((f) => ({ ...f, content: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  placeholder="Button label"
                  value={sectionForm.buttonLabel}
                  onChange={(e) =>
                    setSectionForm((f) => ({
                      ...f,
                      buttonLabel: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  placeholder="Button URL"
                  value={sectionForm.buttonUrl}
                  onChange={(e) =>
                    setSectionForm((f) => ({
                      ...f,
                      buttonUrl: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={sectionForm.isPublished}
                  onChange={(e) =>
                    setSectionForm((f) => ({
                      ...f,
                      isPublished: e.target.checked,
                    }))
                  }
                />
                Published
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowSectionForm(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {sections.length === 0 ? (
            <EmptyAdmin
              label="Nothing has been added yet."
              actionLabel="Add first block"
              onAction={() => {
                setSectionForm(sectionEmpty);
                setEditingSectionId(null);
                setShowSectionForm(true);
              }}
            />
          ) : (
            <div className="space-y-3">
              {[...sections]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {item.title}
                          </h3>
                          <PublishBadge published={item.isPublished} />
                        </div>
                        {item.description ? (
                          <p className="mt-1 text-sm text-muted">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void moveSection(item, -1)}
                          className="rounded-lg border border-border p-1.5"
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void moveSection(item, 1)}
                          className="rounded-lg border border-border p-1.5"
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleSectionPublish(item)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
                        >
                          {item.isPublished ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSectionForm({
                              title: item.title,
                              description: item.description ?? "",
                              content: item.content ?? "",
                              imageUrl: item.imageUrl ?? "",
                              buttonLabel: item.buttonLabel ?? "",
                              buttonUrl: item.buttonUrl ?? "",
                              displayOrder: item.displayOrder,
                              isPublished: item.isPublished,
                            });
                            setEditingSectionId(item.id);
                            setShowSectionForm(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeSection(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </section>
      ) : null}

      {!loading && tab === "documents" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Documents
              </h2>
              <p className="text-sm text-muted">
                {resources.filter((r) => r.isPublished).length} published ·{" "}
                {resources.filter((r) => !r.isPublished).length} drafts for this
                section
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDocForm(emptyDocumentForm(category));
                setShowDocForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Upload PDF
            </button>
          </div>
          {showDocForm ? (
            <DocumentUploadForm
              form={docForm}
              setForm={setDocForm}
              editingId={null}
              onCancel={() => setShowDocForm(false)}
              onSaved={() => {
                setShowDocForm(false);
                setDocForm(emptyDocumentForm(category));
                flash("Document uploaded");
                void load();
              }}
            />
          ) : null}
          {resources.length === 0 && !showDocForm ? (
            <EmptyAdmin
              label="No documents linked to this section yet."
              actionLabel="Upload PDF"
              onAction={() => {
                setDocForm(emptyDocumentForm(category));
                setShowDocForm(true);
              }}
            />
          ) : (
            <div className="space-y-2">
              {resources.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <PublishBadge published={item.isPublished} />
                      {item.fileType ? (
                        <span className="text-xs uppercase text-muted">
                          {item.fileType}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <a
                    href="/admin/resources"
                    className="text-xs font-medium text-accent"
                  >
                    Manage in Resources →
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function EmptyAdmin({
  label,
  actionLabel,
  onAction,
}: {
  label: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <p className="text-sm text-muted">{label}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
      >
        {actionLabel}
      </button>
    </div>
  );
}

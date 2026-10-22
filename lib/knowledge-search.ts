import { readdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { extractTextFromUpload } from "@/lib/file-extract";
import {
  PRIVATE_STORAGE_DIR,
  resourceDownloadUrl,
} from "@/lib/privateStorage";
import {
  buildSearchQuery as buildConversationSearchQuery,
  formatPassagesForPrompt,
  retrieveRelevant,
  stripPromptInjection,
  type RetrievedPassage,
  type SearchDoc,
} from "@/lib/chat/retrieval";

export type ChatResource = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  fileUrl: string | null;
  fileType: string | null;
  extractedText: string | null;
};

export type ChatSearchResult = {
  items: Awaited<ReturnType<typeof prisma.knowledgeItem.findMany>>;
  sections: Awaited<ReturnType<typeof prisma.sectionItem.findMany>>;
  resources: ChatResource[];
  news: Awaited<ReturnType<typeof prisma.newsPost.findMany>>;
  contacts: Awaited<ReturnType<typeof prisma.quickContact.findMany>>;
  terms: string[];
  passages: RetrievedPassage[];
  sources: RetrievalSources;
  bestScore: number;
  hasVerifiedMatch: boolean;
};

type RetrievalSources = ReturnType<typeof retrieveRelevant>["sources"];

const PROMPT_TEXT_LIMIT = 12_000;
const MIN_RESOURCE_SCORE = 4;

function normalizeTerms(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
}

function buildPhrases(terms: string[]): string[] {
  const phrases: string[] = [...terms];
  for (let i = 0; i < terms.length - 1; i++) {
    phrases.push(`${terms[i]} ${terms[i + 1]}`);
  }
  return phrases;
}

export function isHandbookQuery(query: string): boolean {
  return /\b(handbook|hand book|employee handbook)\b/i.test(query);
}

export function shouldOfferDownloads(query: string): boolean {
  return /\b(download|pdf|document|file|attachment|send me the|share the|get the|link to the|can i get)\b/i.test(
    query,
  );
}

function isHandbookResource(resource: ChatResource): boolean {
  return (
    /handbook|hand book/i.test(resource.title) ||
    /employee handbook/i.test(resource.extractedText ?? "")
  );
}

function excerptForQuery(
  text: string | null | undefined,
  query: string,
  terms: string[],
): string {
  if (!text) return "";

  const phrases = [
    ...buildPhrases(terms),
    ...buildPhrases(normalizeTerms(query)),
  ].sort((a, b) => b.length - a.length);

  const lower = text.toLowerCase();
  let matchIndex = -1;

  for (const phrase of phrases) {
    let searchFrom = 0;
    let lastIdx = -1;

    while (searchFrom < lower.length) {
      const idx = lower.indexOf(phrase.toLowerCase(), searchFrom);
      if (idx === -1) break;
      lastIdx = idx;
      searchFrom = idx + 1;
    }

    if (lastIdx !== -1) {
      matchIndex = lastIdx;
      break;
    }
  }

  if (matchIndex === -1) {
    return text.length <= PROMPT_TEXT_LIMIT
      ? text
      : `${text.slice(0, PROMPT_TEXT_LIMIT)}…`;
  }

  const start = Math.max(0, matchIndex - 1_000);
  const excerpt = text.slice(start, start + PROMPT_TEXT_LIMIT);
  return start > 0 ? `…${excerpt}` : excerpt;
}

function scoreResource(resource: ChatResource, terms: string[]): number {
  const haystack =
    `${resource.title} ${resource.description ?? ""} ${resource.extractedText ?? ""}`.toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) score += 2;
  }

  return score;
}

function selectResourcesForQuery(
  resources: ChatResource[],
  query: string,
  terms: string[],
): ChatResource[] {
  if (resources.length === 0) return [];

  const handbookRequested = isHandbookQuery(query);

  return resources
    .map((resource) => ({ resource, score: scoreResource(resource, terms) }))
    .filter(({ resource, score }) => {
      if (handbookRequested && isHandbookResource(resource)) return true;
      return score >= MIN_RESOURCE_SCORE;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ resource }) => resource);
}

async function enrichResources(resources: ChatResource[]): Promise<ChatResource[]> {
  const enriched: ChatResource[] = [];

  for (const resource of resources) {
    if (resource.extractedText || !resource.fileUrl) {
      enriched.push(resource);
      continue;
    }

    const extractedText = stripPromptInjection(
      (await extractTextFromUpload(resource.fileUrl)) ?? "",
    );
    enriched.push({ ...resource, extractedText: extractedText || null });
  }

  return enriched;
}

async function loadResourcesFromDatabase(): Promise<ChatResource[]> {
  return prisma.resource.findMany({
    where: {
      isPublished: true,
      isAiVisible: true,
      isEmployeeVisible: true,
      fileUrl: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      category: true,
      description: true,
      fileUrl: true,
      fileType: true,
      extractedText: true,
    },
  });
}

async function loadResourcesFromDisk(): Promise<ChatResource[]> {
  // Fallback for local private files not yet linked as Resource rows.
  // Never expose /public/uploads directly.
  const files = await readdir(PRIVATE_STORAGE_DIR).catch(() => [] as string[]);
  const resources: ChatResource[] = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (![".pdf", ".docx", ".txt", ".csv"].includes(ext)) continue;

    const fileUrl = `private/${file}`;
    const extractedText = stripPromptInjection(
      (await extractTextFromUpload(fileUrl)) ?? "",
    );
    if (!extractedText) continue;

    const title = file
      .replace(/^\d+-/, "")
      .replace(/\.[^.]+$/, "")
      .replace(/_/g, " ")
      .trim();

    resources.push({
      id: `disk:${file}`,
      title: title || file,
      category: "Resources & Tools",
      description: null,
      fileUrl,
      fileType: ext.replace(".", ""),
      extractedText,
    });
  }

  return resources;
}

export function buildSearchQuery(
  messages: Array<{ role: string; content: string }>,
): string {
  return buildConversationSearchQuery(messages);
}

async function loadAllKnowledgeItems() {
  // Chat only sees published, AI-visible knowledge — never drafts or admin-only rows.
  return prisma.knowledgeItem.findMany({
    where: {
      isPublished: true,
      isAiVisible: true,
      isEmployeeVisible: true,
    },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
  });
}

function scoreKnowledgeItem(
  item: { title: string; category: string; content: string },
  terms: string[],
): number {
  const title = item.title.toLowerCase();
  const category = item.category.toLowerCase();
  const content = item.content.toLowerCase();

  return terms.reduce((score, term) => {
    if (title.includes(term)) return score + 5;
    if (category.includes(term)) return score + 2;
    if (content.includes(term)) return score + 1;
    return score;
  }, 0);
}

function sortKnowledgeByRelevance<T extends { title: string; category: string; content: string }>(
  items: T[],
  terms: string[],
): T[] {
  if (terms.length === 0) return items;
  return [...items].sort(
    (a, b) => scoreKnowledgeItem(b, terms) - scoreKnowledgeItem(a, terms),
  );
}

function scoreTextFields(
  fields: string[],
  terms: string[],
): number {
  const haystack = fields.join(" ").toLowerCase();
  return terms.reduce((score, term) => (haystack.includes(term) ? score + 1 : score), 0);
}

function sortByRelevance<T>(
  items: T[],
  terms: string[],
  getFields: (item: T) => string[],
): T[] {
  if (terms.length === 0) return items;
  return [...items].sort(
    (a, b) => scoreTextFields(getFields(b), terms) - scoreTextFields(getFields(a), terms),
  );
}

async function loadAllPublishedContent() {
  const [sections, resources, news, contacts] = await Promise.all([
    prisma.sectionItem.findMany({
      where: { isPublished: true },
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    }),
    loadResourcesFromDatabase(),
    prisma.newsPost.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.quickContact.findMany({
      where: { isPublished: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { sections, resources, news, contacts };
}

export async function searchKnowledgeForChat(query: string): Promise<ChatSearchResult> {
  const terms = normalizeTerms(query);
  let items: ChatSearchResult["items"] = [];
  let sections: ChatSearchResult["sections"] = [];
  let resources: ChatResource[] = [];
  let news: ChatSearchResult["news"] = [];
  let contacts: ChatSearchResult["contacts"] = [];
  let passages: RetrievedPassage[] = [];
  let sources: ChatSearchResult["sources"] = [];
  let bestScore = 0;
  let hasVerifiedMatch = false;

  try {
    items = await loadAllKnowledgeItems();
  } catch (error) {
    console.error("Failed to load knowledge items for chat:", error);
  }

  try {
    const published = await loadAllPublishedContent();
    sections = published.sections;
    news = published.news;
    contacts = published.contacts;
    resources = published.resources;
  } catch (error) {
    console.warn("Failed to load sections/news/contacts for chat:", error);
  }

  try {
    if (resources.length === 0) {
      resources = await loadResourcesFromDisk();
    }
    resources = await enrichResources(resources);
  } catch (error) {
    console.warn("Failed to load PDF resources for chat:", error);
    resources = [];
  }

  const docs: SearchDoc[] = [
    ...items.map((item) => ({
      id: item.id,
      kind: "knowledge" as const,
      title: item.title,
      category: item.category,
      text: `${item.title}\n${item.content}`,
      sourceUrl: item.sourceUrl,
      published: item.isPublished,
      aiVisible: item.isAiVisible,
    })),
    ...sections.map((section) => ({
      id: section.id,
      kind: "section" as const,
      title: section.title,
      category: section.category,
      text: `${section.title}\n${section.description ?? ""}\n${section.content ?? ""}`,
      published: section.isPublished,
      aiVisible: true,
    })),
    ...news.map((post) => ({
      id: post.id,
      kind: "news" as const,
      title: post.title,
      category: post.category ?? "News & Updates",
      text: `${post.title}\n${post.summary ?? ""}\n${post.content}`,
      published: post.isPublished,
      aiVisible: true,
    })),
    ...contacts.map((contact) => ({
      id: contact.id,
      kind: "contact" as const,
      title: contact.name,
      category: "Quick Contacts",
      text: [contact.name, contact.jobTitle, contact.department, contact.email, contact.phone]
        .filter(Boolean)
        .join(" "),
      published: contact.isPublished,
      aiVisible: true,
    })),
    ...resources.map((resource) => ({
      id: resource.id,
      kind: "pdf" as const,
      title: resource.title,
      category: resource.category,
      text: `${resource.title}\n${resource.description ?? ""}\n${stripPromptInjection(resource.extractedText ?? "")}`,
      published: true,
      aiVisible: true,
    })),
  ];

  const retrieved = retrieveRelevant(docs, query);
  bestScore = retrieved.bestScore;
  hasVerifiedMatch = retrieved.hasVerifiedMatch;

  if (!hasVerifiedMatch) {
    const handbookResources = isHandbookQuery(query)
      ? selectResourcesForQuery(resources, query, terms)
      : [];
    return {
      items: [],
      sections: [],
      resources: handbookResources,
      news: [],
      contacts: [],
      terms,
      passages: [],
      sources: [],
      bestScore,
      hasVerifiedMatch,
    };
  }

  passages = retrieved.passages;
  sources = retrieved.sources;

  const matchedIds = new Set(retrieved.sources.map((source) => `${source.kind}:${source.title}`));
  items = sortKnowledgeByRelevance(
    items.filter((item) => matchedIds.has(`knowledge:${item.title}`)),
    terms,
  );
  sections = sortByRelevance(
    sections.filter((section) => matchedIds.has(`section:${section.title}`)),
    terms,
    (s) => [s.title, s.category, s.description ?? "", s.content ?? ""],
  );
  news = sortByRelevance(
    news.filter((post) => matchedIds.has(`news:${post.title}`)),
    terms,
    (n) => [n.title, n.summary ?? "", n.content, n.category ?? ""],
  );
  contacts = sortByRelevance(
    contacts.filter((contact) => matchedIds.has(`contact:${contact.name}`)),
    terms,
    (c) => [c.name, c.jobTitle ?? "", c.department ?? "", c.email ?? "", c.phone ?? ""],
  );
  const retrievedPdfs = resources.filter((resource) =>
    matchedIds.has(`pdf:${resource.title}`),
  );
  resources = isHandbookQuery(query)
    ? selectResourcesForQuery(resources, query, terms)
    : retrievedPdfs.slice(0, 3);

  return {
    items,
    sections,
    resources,
    news,
    contacts,
    terms,
    passages,
    sources,
    bestScore,
    hasVerifiedMatch,
  };
}

export function formatKnowledgeForPrompt(
  result: ChatSearchResult,
  query = "",
  includeDownloadUrls = false,
): string {
  const { items, sections, resources, news, contacts, terms, passages } = result;

  if (
    items.length === 0 &&
    sections.length === 0 &&
    resources.length === 0 &&
    news.length === 0 &&
    contacts.length === 0 &&
    passages.length === 0
  ) {
    return "";
  }

  const blocks: string[] = [];

  if (passages.length > 0) {
    blocks.push(
      `## Relevant verified passages (use these first; do not invent extra Habari facts)\n\n${formatPassagesForPrompt(passages)}`,
    );
  }

  if (items.length > 0) {
    const topItems = items.slice(0, 6);
    blocks.push(
      `## Knowledge base (top ${topItems.length} matching published items)\n\n` +
        topItems
          .map(
            (item) =>
              `[Knowledge — ${item.category}] ${item.title}\n${item.content}${item.sourceUrl ? `\nSource: ${item.sourceUrl}` : ""}`,
          )
          .join("\n\n"),
    );
  }

  if (sections.length > 0) {
    blocks.push(
      `## Sections (all ${sections.length} published items)\n\n` +
        sections
          .map((section) => {
            const parts = [
              `[Section — ${section.category}] ${section.title}`,
              section.description ? `Description: ${section.description}` : "",
              section.content ? `Content: ${section.content}` : "",
              section.buttonLabel && section.buttonUrl
                ? `Link: ${section.buttonLabel} → ${section.buttonUrl}`
                : "",
            ];
            return parts.filter(Boolean).join("\n");
          })
          .join("\n\n"),
    );
  }

  if (resources.length > 0) {
    blocks.push(
      resources
        .map((resource) => {
          const parts = [
            `[PDF — ${resource.category}] ${resource.title}`,
            resource.description ? `Summary: ${resource.description}` : "",
            includeDownloadUrls && resource.fileUrl
              ? `DownloadURL: ${resource.fileUrl}`
              : "",
            resource.extractedText
              ? `DocumentContent:\n${excerptForQuery(resource.extractedText, query, terms)}`
              : "",
          ];
          return parts.filter(Boolean).join("\n");
        })
        .join("\n\n"),
    );
  }

  if (news.length > 0) {
    blocks.push(
      `## News (all ${news.length} published items)\n\n` +
        news
          .map(
            (post) =>
              `[News${post.category ? ` — ${post.category}` : ""}] ${post.title}\n${post.summary ? `${post.summary}\n` : ""}${post.content}`,
          )
          .join("\n\n"),
    );
  }

  if (contacts.length > 0) {
    blocks.push(
      `## Quick contacts (all ${contacts.length} published contacts — use these for who to email/call)\n\n` +
        contacts
          .map((contact) => {
            const parts = [
              `[Contact] ${contact.name}`,
              contact.jobTitle ? `Role: ${contact.jobTitle}` : "",
              contact.department ? `Department: ${contact.department}` : "",
              contact.email ? `Email: ${contact.email}` : "",
              contact.phone ? `Phone: ${contact.phone}` : "",
              contact.office ? `Office: ${contact.office}` : "",
            ];
            return parts.filter(Boolean).join("\n");
          })
          .join("\n\n"),
    );
  }

  return blocks.filter(Boolean).join("\n\n");
}

export function formatResourceAttachments(resources: ChatResource[]) {
  return resources
    .filter((r) => r.fileUrl && !r.id.startsWith("disk:"))
    .map((r) => ({
      title: r.title,
      fileUrl: resourceDownloadUrl(r.id),
      fileType: r.fileType,
    }));
}

export function hasSearchContent(result: ChatSearchResult): boolean {
  return (
    result.items.length > 0 ||
    result.sections.length > 0 ||
    result.resources.length > 0 ||
    result.news.length > 0 ||
    result.contacts.length > 0 ||
    result.passages.length > 0
  );
}

export function hasPdfContent(result: ChatSearchResult): boolean {
  return result.resources.some((r) => Boolean(r.extractedText?.trim()));
}

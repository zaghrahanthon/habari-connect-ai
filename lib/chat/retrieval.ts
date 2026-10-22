/**
 * Lightweight semantic retrieval for published Habari knowledge and PDFs.
 * Uses query expansion, token overlap, and passage ranking — no embeddings required.
 */

export const MIN_VERIFIED_SCORE = 4;

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "how",
  "what",
  "when",
  "where",
  "who",
  "why",
  "with",
  "this",
  "that",
  "from",
  "have",
  "has",
  "was",
  "were",
  "our",
  "any",
  "about",
]);

const SYNONYMS: Record<string, string[]> = {
  outlook: ["email", "mailbox", "mail", "office"],
  email: ["outlook", "mail", "mailbox"],
  leave: ["vacation", "timeoff", "annual", "absence"],
  password: ["login", "credentials", "signin", "reset"],
  vpn: ["remote", "network", "access"],
  printer: ["print", "printing"],
  wifi: ["wireless", "network", "internet"],
  payroll: ["payslip", "salary", "pay"],
  handbook: ["policy", "policies", "procedure"],
  policy: ["handbook", "policies", "procedure"],
  it: ["support", "technical", "computer", "laptop"],
  hr: ["human", "people", "peopleculture"],
  contact: ["email", "phone", "directory"],
  meeting: ["boardroom", "room", "calendar"],
  news: ["update", "announcement", "whatsnew"],
};

export type SearchDoc = {
  id: string;
  kind: "knowledge" | "section" | "news" | "contact" | "pdf";
  title: string;
  category: string;
  text: string;
  sourceUrl?: string | null;
  published: boolean;
  aiVisible: boolean;
};

export type RetrievedPassage = {
  docId: string;
  kind: SearchDoc["kind"];
  title: string;
  category: string;
  passage: string;
  score: number;
  sourceUrl?: string | null;
};

export type RetrievalResult = {
  passages: RetrievedPassage[];
  sources: Array<{
    title: string;
    category: string;
    kind: SearchDoc["kind"];
    sourceUrl?: string | null;
  }>;
  bestScore: number;
  hasVerifiedMatch: boolean;
};

export function isChatVisible(doc: Pick<SearchDoc, "published" | "aiVisible">) {
  return doc.published && doc.aiVisible;
}

/** Strip instruction-like text from uploaded documents before prompting. */
export function stripPromptInjection(text: string): string {
  return text
    .replace(/ignore (all |any )?(previous|prior|above) instructions?/gi, " ")
    .replace(/you are now (a |an |the )?[^\n.]{0,80}/gi, " ")
    .replace(/system\s*prompt\s*:/gi, " ")
    .replace(/forget (all )?(previous|prior) (instructions?|rules?)/gi, " ")
    .replace(/do not follow (the )?(habari|company) (rules?|policy)/gi, " ")
    .replace(/\b(sudo|override)\s+system\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchQuery(
  messages: Array<{ role: string; content: string }>,
): string {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .slice(-3)
    .join(" ");
}

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function expandQueryTerms(query: string): string[] {
  const base = tokenize(query);
  const expanded = new Set(base);
  for (const term of base) {
    const extras = SYNONYMS[term];
    if (extras) extras.forEach((item) => expanded.add(item));
    if (term.endsWith("s") && term.length > 4) expanded.add(term.slice(0, -1));
    if (term.endsWith("ing") && term.length > 6) expanded.add(term.slice(0, -3));
  }
  return [...expanded];
}

function fieldScore(haystack: string, terms: string[], weight: number): number {
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) {
      score += weight;
      continue;
    }
    if (term.length >= 4) {
      const prefix = term.slice(0, Math.max(4, Math.ceil(term.length * 0.75)));
      if (haystack.includes(prefix)) score += weight * 0.5;
    }
  }
  return score;
}

export function scoreDocument(doc: SearchDoc, terms: string[]): number {
  if (!isChatVisible(doc) || terms.length === 0) return 0;
  const title = doc.title.toLowerCase();
  const category = doc.category.toLowerCase();
  const text = doc.text.toLowerCase();
  return (
    fieldScore(title, terms, 6) +
    fieldScore(category, terms, 3) +
    fieldScore(text, terms, 1)
  );
}

export function extractPassages(
  text: string,
  terms: string[],
  maxPassages = 3,
  window = 420,
): string[] {
  const cleaned = stripPromptInjection(text);
  if (!cleaned) return [];
  if (terms.length === 0 || cleaned.length <= window) {
    return [cleaned.slice(0, window * 2)];
  }

  const lower = cleaned.toLowerCase();
  const indexes: number[] = [];
  for (const term of terms) {
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(term, from);
      if (idx === -1) break;
      indexes.push(idx);
      from = idx + term.length;
      if (indexes.length > 20) break;
    }
  }

  if (indexes.length === 0) {
    return [cleaned.slice(0, window)];
  }

  const unique = [...new Set(indexes)].sort((a, b) => a - b);
  const passages: string[] = [];
  let lastEnd = -1;
  for (const idx of unique) {
    const start = Math.max(0, idx - 80);
    if (start < lastEnd - 40) continue;
    const chunk = cleaned.slice(start, start + window).trim();
    if (chunk) passages.push(start > 0 ? `…${chunk}` : chunk);
    lastEnd = start + window;
    if (passages.length >= maxPassages) break;
  }
  return passages;
}

export function retrieveRelevant(
  docs: SearchDoc[],
  query: string,
  limit = 8,
): RetrievalResult {
  const terms = expandQueryTerms(query);
  const visible = docs.filter(isChatVisible);
  const scored = visible
    .map((doc) => ({ doc, score: scoreDocument(doc, terms) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const passages: RetrievedPassage[] = [];
  for (const { doc, score } of scored) {
    const chunks = extractPassages(doc.text, terms);
    for (const passage of chunks) {
      passages.push({
        docId: doc.id,
        kind: doc.kind,
        title: doc.title,
        category: doc.category,
        passage,
        score,
        sourceUrl: doc.sourceUrl,
      });
    }
  }

  const sources = scored.map(({ doc }) => ({
    title: doc.title,
    category: doc.category,
    kind: doc.kind,
    sourceUrl: doc.sourceUrl,
  }));

  const bestScore = scored[0]?.score ?? 0;
  return {
    passages: passages.slice(0, 12),
    sources,
    bestScore,
    hasVerifiedMatch: bestScore >= MIN_VERIFIED_SCORE,
  };
}

export function formatPassagesForPrompt(passages: RetrievedPassage[]): string {
  if (passages.length === 0) return "";
  return passages
    .map(
      (item, index) =>
        `[Verified ${item.kind} ${index + 1} — ${item.category}] ${item.title}\n${item.passage}${
          item.sourceUrl ? `\nSource: ${item.sourceUrl}` : ""
        }`,
    )
    .join("\n\n");
}

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /\b(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){8,12}\d\b/g;
const LONG_NUMBER = /\b\d{6,}\b/g;

export function sanitizeInsightTopic(question: string): string {
  const stripped = question
    .replace(EMAIL, "[email]")
    .replace(PHONE, "[phone]")
    .replace(LONG_NUMBER, "[id]")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = stripped
    .split(" ")
    .filter((word) => word.length > 2 && word !== "email" && word !== "phone")
    .slice(0, 8);

  return words.join(" ").slice(0, 80) || "general";
}

export type InsightOutcome =
  | "answered_internal"
  | "answered_general"
  | "missing_company"
  | "low_confidence";

export function insightOutcome(mode: string, hasVerifiedMatch: boolean): InsightOutcome {
  if (mode === "company_missing") return "missing_company";
  if (mode === "internal_verified") return "answered_internal";
  if (mode === "hybrid_general" || mode === "internal_tool" || mode === "greeting") {
    return hasVerifiedMatch ? "answered_internal" : "answered_general";
  }
  return "low_confidence";
}

export function shouldRecordInsight(outcome: InsightOutcome, intent: string): boolean {
  if (intent === "greeting") return false;
  return (
    outcome === "missing_company" ||
    outcome === "low_confidence" ||
    outcome === "answered_general" ||
    outcome === "answered_internal"
  );
}

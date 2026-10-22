import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listChatInsights } from "@/lib/chat/insights";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const rows = await listChatInsights();
    const missingCompany = rows.filter((row) => row.outcome === "missing_company");
    const lowConfidence = rows.filter((row) => row.outcome === "low_confidence");
    const unansweredInternal = rows.filter(
      (row) => row.outcome === "answered_general" || row.outcome === "missing_company",
    );
    const frequentlyAsked = [...rows]
      .filter((row) => row.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    const needsClarification = rows.filter(
      (row) =>
        (row.outcome === "missing_company" || row.outcome === "low_confidence") &&
        row.count >= 2,
    );

    return NextResponse.json({
      totals: {
        topics: rows.length,
        missingCompany: missingCompany.reduce((sum, row) => sum + row.count, 0),
        generalAnswers: rows
          .filter((row) => row.outcome === "answered_general")
          .reduce((sum, row) => sum + row.count, 0),
        internalAnswers: rows
          .filter((row) => row.outcome === "answered_internal")
          .reduce((sum, row) => sum + row.count, 0),
      },
      couldNotAnswerConfidently: unansweredInternal.slice(0, 25),
      missingCompany: missingCompany.slice(0, 25),
      frequentlyAsked,
      needsClarification: needsClarification.slice(0, 25),
    });
  } catch (e) {
    return handleApiError(e, "Failed to load chatbot insights");
  }
}

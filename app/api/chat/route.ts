import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  buildSearchQuery,
  formatKnowledgeForPrompt,
  formatResourceAttachments,
  hasPdfContent,
  hasSearchContent,
  isHandbookQuery,
  searchKnowledgeForChat,
  shouldOfferDownloads,
} from "@/lib/knowledge-search";
import { appendVerifiedDownloadSection } from "@/lib/chat-resources";
import { getCalendarContextForChat } from "@/lib/calendarQuery";
import { getPeopleContextForChat } from "@/lib/peopleQuery";
import { getAnalyticsContextForChat } from "@/lib/analyticsAi";
import { todayDateString } from "@/lib/calendar/dateUtils";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { checkAiRateLimit } from "@/lib/aiRateLimit";
import { classifyIntent } from "@/lib/chat/intent";
import { buildHybridSystemPrompt, decideResponseMode } from "@/lib/chat/hybrid";
import { suggestFollowUps } from "@/lib/chat/followups";
import { insightOutcome, sanitizeInsightTopic } from "@/lib/chat/sanitizeInsight";
import { recordChatInsight } from "@/lib/chat/insights";

type ChatRequestMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: Request) {
  try {
    const office = await requireOfficeNetwork("/api/chat");
    if (office.error) return office.error;

    const rate = checkAiRateLimit(office.ip);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error:
            "Too many AI requests from this office network. Please try again shortly.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSeconds),
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey || apiKey === "your_openai_api_key_here") {
      return NextResponse.json(
        {
          error:
            "OpenAI API key is not configured. Create a .env file in the project root (not .env.example) and add OPENAI_API_KEY, then restart the dev server.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as {
      messages?: ChatRequestMessage[];
    };

    const messages = body.messages ?? [];

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "At least one message is required." },
        { status: 400 },
      );
    }

    const lastUserMessage =
      [...messages].reverse().find((message) => message.role === "user")
        ?.content ?? "";
    const priorUserMessages = messages
      .filter((message) => message.role === "user")
      .slice(0, -1)
      .map((message) => message.content);

    const searchQuery = buildSearchQuery(messages);
    const intent = classifyIntent(lastUserMessage, priorUserMessages);
    const offerDownloads = shouldOfferDownloads(lastUserMessage || searchQuery);

    const [searchResult, calendarContext, peopleContext, analyticsContext] =
      await Promise.all([
        searchKnowledgeForChat(searchQuery),
        getCalendarContextForChat(searchQuery),
        getPeopleContextForChat(searchQuery),
        getAnalyticsContextForChat(searchQuery),
      ]);

    if (searchResult.items.length === 0 && searchResult.passages.length === 0) {
      console.warn(
        "Chat: 0 matching knowledge passages — check DATABASE_URL if articles were expected",
      );
    }

    const dbKnowledge = formatKnowledgeForPrompt(
      searchResult,
      searchQuery,
      offerDownloads,
    );

    const attachments = offerDownloads
      ? formatResourceAttachments(searchResult.resources)
      : [];

    const extras = [
      peopleContext.relevant ? peopleContext.context : "",
      analyticsContext.relevant ? analyticsContext.context : "",
      calendarContext.relevant
        ? `${calendarContext.context}\nCurrent company date (Africa/Johannesburg): ${todayDateString()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const mode = decideResponseMode({
      intent,
      hasVerifiedMatch: searchResult.hasVerifiedMatch,
      hasAnyInternalHit: hasSearchContent(searchResult),
    });

    const handbookNote =
      hasPdfContent(searchResult) && !isHandbookQuery(searchQuery)
        ? "PDF excerpts matched this question. Use them only if they are relevant."
        : "";

    const systemPrompt = buildHybridSystemPrompt({
      mode,
      intent,
      verifiedBlock: [dbKnowledge, handbookNote].filter(Boolean).join("\n\n"),
      extrasBlock: extras,
    });

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-12).map((message) => ({
          role: message.role as "user" | "assistant",
          content: message.content,
        })),
      ],
      temperature:
        mode === "internal_verified" ||
        intent === "security" ||
        intent === "hr_policy"
          ? 0.2
          : 0.5,
      max_tokens: 1200,
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply) {
      return NextResponse.json(
        { error: "No response from AI. Please try again." },
        { status: 500 },
      );
    }

    const message = appendVerifiedDownloadSection(
      reply,
      attachments,
      offerDownloads,
    );

    const followUps = suggestFollowUps({
      intent,
      mode,
      sourceTitles: searchResult.sources.map((source) => source.title),
    });

    const sources = searchResult.sources.slice(0, 5).map((source) => ({
      title: source.title,
      category: source.category,
      kind: source.kind,
      sourceUrl: source.sourceUrl ?? undefined,
    }));

    const outcome = insightOutcome(mode, searchResult.hasVerifiedMatch);
    void recordChatInsight({
      intent,
      topic: sanitizeInsightTopic(lastUserMessage),
      outcome,
      missingArea: mode === "company_missing" ? intent : null,
    });

    return NextResponse.json({
      message,
      attachments: attachments.length > 0 ? attachments : undefined,
      followUps,
      sources: sources.length > 0 ? sources : undefined,
      mode,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    const message =
      error instanceof Error && error.message.includes("API key")
        ? "OpenAI API key is invalid. Check OPENAI_API_KEY in your .env file."
        : "I couldn’t reach the AI service just now. Please try again in a moment.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

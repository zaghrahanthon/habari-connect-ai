import { NextResponse } from "next/server";
import OpenAI from "openai";
import { LEAVE_BASELINE, LEAVE_GUIDANCE } from "@/lib/knowledge";
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
import { todayDateString } from "@/lib/calendar/dateUtils";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { checkAiRateLimit } from "@/lib/aiRateLimit";

const BASE_INSTRUCTIONS = `You are Habari Connect AI, an internal employee assistant for Habari Media.

Always answer in a friendly, clear, professional way.

Employees are not individually authenticated. Never assume the user’s real identity from a display name or greeting. Do not discuss personal payslips, individual leave balances, private HR cases, or personal approvals.
TODO: Personal or confidential functionality requires individual authentication.

CRITICAL — source of truth:
- Answer ONLY from Habari Connect dashboard content provided below (Knowledge, Sections, News, Quick contacts, PDFs), published People & Culture profiles when supplied, and, when supplied, live company calendar data.
- Do NOT use the public internet or habarimedia.com. Do NOT invent facts outside the provided content.
- NEVER invent names, emails, phone numbers, URLs, procedures, events, locations, organisers, registration links, dates, or times.
- Do NOT add generic steps unless they are explicitly written in the admin content below.
- If dashboard, people, or calendar content below answers the question, quote or paraphrase it only — do not expand with assumed details.

People & Culture rules (when people profiles are supplied):
- Only use published People & Culture profiles from the context below.
- Never invent colleagues, managers, departments, or contact details.
- Do not mention birthdays unless they appear in the supplied context.
- Do not discuss salary, leave balances, disciplinary matters, or private HR information.
- If no matching person is available, say you could not find that person in the published People & Culture profiles.

Calendar rules (when calendar information is supplied):
- Use Africa/Johannesburg as the company timezone.
- Clearly distinguish between today, tomorrow, this week, and future dates.
- Include the event date, time, and location when available.
- Company calendar information is sourced from the live Habari company calendar.
- If no matching event is available, say exactly: "I couldn’t find a matching event in the current Habari company calendar."

How to format replies:
- Search ALL Knowledge items for every question and answer from any matching item.
- Search Quick contacts when the user asks who to email, call, or contact.
- Search People & Culture profiles for questions about staff, teams, departments, offices, new starters, or roles.
- Search Sections, News, and PDF excerpts when they match the question.
- Use live calendar context for event/date/schedule questions.
- Only use Employee Handbook / PDF content when the question is about policies, procedures, HR rules, or when the user explicitly mentions the handbook.
- Do NOT mention or summarize the employee handbook for general company questions unless handbook content is directly relevant.
- For leave questions, include the Axiopay link once: ${LEAVE_GUIDANCE.url}
- Do NOT include file download links in your reply unless the user explicitly asked to download a document.

If matching content is provided below, use it as your primary source.

Only if nothing relevant is provided below, the leave baseline does not cover the question, and no calendar or people context applies, respond exactly with:
"I don't have that information in the Habari Connect knowledge base yet. You can ask an admin to add it."

Leave baseline (only when leave is asked and not covered in admin content below):
${LEAVE_BASELINE}`;

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

    // Employee chat is anonymous office-network access — no conversation persistence in MVP.
    // TODO: Optional anonymous HTTP-only conversation cookie if history is required later.

    const searchQuery = buildSearchQuery(messages);
    const offerDownloads = shouldOfferDownloads(searchQuery);

    const [searchResult, calendarContext, peopleContext] = await Promise.all([
      searchKnowledgeForChat(searchQuery),
      getCalendarContextForChat(searchQuery),
      getPeopleContextForChat(searchQuery),
    ]);

    if (searchResult.items.length === 0) {
      console.warn(
        "Chat: 0 knowledge items loaded — check DATABASE_URL and restart npm run dev",
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

    const contentLoaded =
      hasSearchContent(searchResult) ||
      calendarContext.relevant ||
      peopleContext.relevant;
    const pdfLoaded = hasPdfContent(searchResult);

    const knowledgeHeader =
      searchResult.items.length > 0
        ? `Knowledge base (${searchResult.items.length} published items — search ALL items below and answer from any that match; do NOT say information is unavailable if a Knowledge item answers the question):`
        : contentLoaded
          ? "Relevant published content from Habari Connect (use the section that matches the user's question):"
          : "No matching published content was found.";

    const handbookNote =
      pdfLoaded && !isHandbookQuery(searchQuery)
        ? "\nNote: PDF handbook excerpts are included only because they matched the question — do not bring up the handbook if the question is about something else."
        : "";

    const calendarBlock = calendarContext.relevant
      ? `\n\n${calendarContext.context}\n\nCurrent company date (Africa/Johannesburg): ${todayDateString()}`
      : "";

    const peopleBlock = peopleContext.relevant
      ? `\n\n${peopleContext.context}`
      : "";

    const systemPrompt = contentLoaded
      ? `${BASE_INSTRUCTIONS}${handbookNote}\n\n${knowledgeHeader}\n${dbKnowledge}${peopleBlock}${calendarBlock}`
      : `${BASE_INSTRUCTIONS}\n\nNo matching published content was found. Use baseline rules only, or say the information is not available yet.`;

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      temperature: contentLoaded ? 0.3 : 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply) {
      return NextResponse.json(
        { error: "No response from AI." },
        { status: 500 },
      );
    }

    const message = appendVerifiedDownloadSection(
      reply,
      attachments,
      offerDownloads,
    );

    return NextResponse.json({
      message,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    const message =
      error instanceof Error && error.message.includes("API key")
        ? "OpenAI API key is invalid. Check OPENAI_API_KEY in your .env file."
        : "Failed to generate response. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

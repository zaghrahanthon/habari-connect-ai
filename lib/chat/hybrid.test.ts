import { describe, expect, it } from "vitest";
import { classifyIntent } from "@/lib/chat/intent";
import { buildHybridSystemPrompt, decideResponseMode } from "@/lib/chat/hybrid";
import { buildSearchQuery } from "@/lib/chat/retrieval";

describe("general questions with no internal knowledge", () => {
  it("uses hybrid general mode for everyday workplace questions", () => {
    const intent = classifyIntent("How do I configure Microsoft Outlook?");
    expect(intent).toBe("it_support");
    expect(
      decideResponseMode({
        intent,
        hasVerifiedMatch: false,
        hasAnyInternalHit: false,
      }),
    ).toBe("hybrid_general");

    const prompt = buildHybridSystemPrompt({
      mode: "hybrid_general",
      intent,
      verifiedBlock: "",
      extrasBlock: "",
    });
    expect(prompt).toMatch(/Habari-specific settings are not verified/i);
    expect(prompt).not.toMatch(/I don't have that information in the Habari Connect knowledge base yet/);
  });
});

describe("company-specific questions with missing information", () => {
  it("does not invent Habari policy when verified knowledge is missing", () => {
    const intent = classifyIntent("What is Habari Media's work-from-home policy?");
    expect(intent).toBe("hr_policy");
    expect(
      decideResponseMode({
        intent,
        hasVerifiedMatch: false,
        hasAnyInternalHit: false,
      }),
    ).toBe("company_missing");

    const prompt = buildHybridSystemPrompt({
      mode: "company_missing",
      intent,
      verifiedBlock: "",
      extrasBlock: "",
    });
    expect(prompt).toMatch(/Never invent internal policies/);
    expect(prompt).toMatch(/verified Habari content does not answer it/i);
  });
});

describe("conversation memory", () => {
  it("treats short pronoun questions as follow-ups and includes prior user turns in search", () => {
    const previous = ["How do I configure Microsoft Outlook?"];
    expect(classifyIntent("What about the mobile app for it?", previous)).toBe("follow_up");

    const query = buildSearchQuery([
      { role: "user", content: "How do I configure Microsoft Outlook?" },
      { role: "assistant", content: "Here are general Outlook steps." },
      { role: "user", content: "What about the mobile app for it?" },
    ]);
    expect(query).toMatch(/Outlook/);
    expect(query).toMatch(/mobile app/);
  });

  it("asks the model to use earlier messages instead of restarting", () => {
    const prompt = buildHybridSystemPrompt({
      mode: "hybrid_general",
      intent: "follow_up",
      verifiedBlock: "",
      extrasBlock: "",
    });
    expect(prompt).toMatch(/Use earlier messages in this conversation/);
  });
});

describe("verified internal answers", () => {
  it("prioritises verified Habari content when retrieval is confident", () => {
    expect(
      decideResponseMode({
        intent: "company_specific",
        hasVerifiedMatch: true,
        hasAnyInternalHit: true,
      }),
    ).toBe("internal_verified");
  });
});

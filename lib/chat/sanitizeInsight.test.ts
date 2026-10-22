import { describe, expect, it } from "vitest";
import {
  insightOutcome,
  sanitizeInsightTopic,
  shouldRecordInsight,
} from "@/lib/chat/sanitizeInsight";
import { isSafeChatLink } from "@/lib/chat-resources";

describe("insight privacy", () => {
  it("strips emails, phones and extra wording from stored topics", () => {
    const topic = sanitizeInsightTopic(
      "Please email jane.doe@habarimedia.com or call +27 82 123 4567 about payroll",
    );
    expect(topic).not.toMatch(/@/);
    expect(topic).not.toMatch(/82/);
    expect(topic).toMatch(/payroll/);
  });

  it("does not store greetings and maps outcomes without raw questions", () => {
    expect(shouldRecordInsight("answered_general", "greeting")).toBe(false);
    expect(insightOutcome("company_missing", false)).toBe("missing_company");
    expect(insightOutcome("hybrid_general", false)).toBe("answered_general");
  });
});

describe("chat link safety", () => {
  it("allows employee dashboard links and resource downloads", () => {
    expect(isSafeChatLink("/dashboard/it-support")).toBe(true);
    expect(isSafeChatLink("/api/resources/abc")).toBe(true);
    expect(isSafeChatLink("https://axiopay.payus.co.za")).toBe(true);
  });

  it("blocks script URLs and admin routes", () => {
    expect(isSafeChatLink("javascript:alert(1)")).toBe(false);
    expect(isSafeChatLink("  JAVASCRIPT:alert(1)")).toBe(false);
    expect(isSafeChatLink("data:text/html,hi")).toBe(false);
    expect(isSafeChatLink("/admin/users")).toBe(false);
  });
});

import type { ChatIntent } from "@/lib/chat/intent";
import type { ResponseMode } from "@/lib/chat/hybrid";

export function suggestFollowUps(input: {
  intent: ChatIntent;
  mode: ResponseMode;
  sourceTitles?: string[];
}): string[] {
  const { intent, mode, sourceTitles = [] } = input;

  if (intent === "greeting") {
    return ["What's new at Habari?", "Who should I contact for HR?", "Help me with IT support"];
  }

  if (mode === "company_missing") {
    return [
      "Who should I contact for HR?",
      "Find company policies",
      "Help me with IT support",
    ];
  }

  if (intent === "it_support") {
    return [
      "How do I reset my password?",
      "How do I connect to office Wi-Fi?",
      "Who do I contact for IT support?",
    ];
  }

  if (intent === "hr_policy") {
    return [
      "How do I apply for leave?",
      "Find company policies",
      "Who should I contact for HR?",
    ];
  }

  if (intent === "internal_tool") {
    return [
      "What's new at Habari?",
      "Show website analytics",
      "Find people in People & Culture",
    ];
  }

  if (sourceTitles[0]) {
    return [
      `Tell me more about ${sourceTitles[0]}`,
      "Who should I contact about this?",
      "What's new at Habari?",
    ];
  }

  return ["What's new at Habari?", "Find company policies", "Help me with IT support"];
}

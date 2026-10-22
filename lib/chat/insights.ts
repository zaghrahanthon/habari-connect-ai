import { prisma } from "@/lib/prisma";
import type { InsightOutcome } from "@/lib/chat/sanitizeInsight";
import { shouldRecordInsight } from "@/lib/chat/sanitizeInsight";

export async function recordChatInsight(input: {
  intent: string;
  topic: string;
  outcome: InsightOutcome;
  missingArea?: string | null;
}): Promise<void> {
  if (!shouldRecordInsight(input.outcome, input.intent)) return;

  const topic = input.topic.trim() || "general";
  try {
    if (typeof prisma.chatInsight === "undefined") return;
    await prisma.chatInsight.upsert({
      where: {
        intent_topic_outcome: {
          intent: input.intent,
          topic,
          outcome: input.outcome,
        },
      },
      create: {
        intent: input.intent,
        topic,
        outcome: input.outcome,
        missingArea: input.missingArea ?? null,
        count: 1,
        lastSeenAt: new Date(),
      },
      update: {
        count: { increment: 1 },
        lastSeenAt: new Date(),
        missingArea: input.missingArea ?? undefined,
      },
    });
  } catch (error) {
    console.warn("Chat insight was not stored:", error);
  }
}

export async function listChatInsights() {
  if (typeof prisma.chatInsight === "undefined") return [];
  return prisma.chatInsight.findMany({
    orderBy: [{ count: "desc" }, { lastSeenAt: "desc" }],
    take: 100,
  });
}

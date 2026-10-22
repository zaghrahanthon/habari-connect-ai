-- CreateTable
CREATE TABLE "ChatInsight" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "missingArea" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatInsight_intent_topic_outcome_key" ON "ChatInsight"("intent", "topic", "outcome");

-- CreateIndex
CREATE INDEX "ChatInsight_outcome_lastSeenAt_idx" ON "ChatInsight"("outcome", "lastSeenAt");

-- CreateIndex
CREATE INDEX "ChatInsight_count_idx" ON "ChatInsight"("count");

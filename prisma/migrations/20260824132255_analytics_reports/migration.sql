-- CreateTable
CREATE TABLE "AnalyticsProperty" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "websiteUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reportData" JSONB NOT NULL,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsProperty_propertyId_key" ON "AnalyticsProperty"("propertyId");

-- CreateIndex
CREATE INDEX "AnalyticsProperty_isActive_idx" ON "AnalyticsProperty"("isActive");

-- CreateIndex
CREATE INDEX "AnalyticsProperty_displayOrder_idx" ON "AnalyticsProperty"("displayOrder");

-- CreateIndex
CREATE INDEX "AnalyticsReport_propertyId_idx" ON "AnalyticsReport"("propertyId");

-- CreateIndex
CREATE INDEX "AnalyticsReport_createdAt_idx" ON "AnalyticsReport"("createdAt");

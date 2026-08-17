-- CreateTable
CREATE TABLE "PeopleProfile" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "department" TEXT,
    "office" TEXT,
    "startDate" TIMESTAMP(3),
    "shortIntro" TEXT,
    "bio" TEXT,
    "interests" TEXT,
    "skills" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "manager" TEXT,
    "linkedInUrl" TEXT,
    "birthday" TIMESTAMP(3),
    "imageUrl" TEXT,
    "isNewStarter" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "showEmail" BOOLEAN NOT NULL DEFAULT true,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "showBirthday" BOOLEAN NOT NULL DEFAULT false,
    "showLinkedIn" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeopleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeopleProfile_isPublished_idx" ON "PeopleProfile"("isPublished");

-- CreateIndex
CREATE INDEX "PeopleProfile_isPublished_isNewStarter_idx" ON "PeopleProfile"("isPublished", "isNewStarter");

-- CreateIndex
CREATE INDEX "PeopleProfile_department_idx" ON "PeopleProfile"("department");

-- CreateIndex
CREATE INDEX "PeopleProfile_office_idx" ON "PeopleProfile"("office");

-- CreateIndex
CREATE INDEX "PeopleProfile_displayOrder_idx" ON "PeopleProfile"("displayOrder");

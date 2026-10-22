-- CreateEnum
CREATE TYPE "RoomBookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "MeetingRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomBooking" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "RoomBookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingRoom_name_key" ON "MeetingRoom"("name");

-- CreateIndex
CREATE INDEX "MeetingRoom_isActive_idx" ON "MeetingRoom"("isActive");

-- CreateIndex
CREATE INDEX "RoomBooking_roomId_startTime_endTime_idx" ON "RoomBooking"("roomId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "RoomBooking_roomId_status_startTime_idx" ON "RoomBooking"("roomId", "status", "startTime");

-- CreateIndex
CREATE INDEX "RoomBooking_userId_startTime_idx" ON "RoomBooking"("userId", "startTime");

-- CreateIndex
CREATE INDEX "RoomBooking_status_startTime_idx" ON "RoomBooking"("status", "startTime");

-- AddForeignKey
ALTER TABLE "RoomBooking" ADD CONSTRAINT "RoomBooking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "MeetingRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBooking" ADD CONSTRAINT "RoomBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prevent overlapping confirmed bookings for the same room (concurrency-safe)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "RoomBooking"
  ADD CONSTRAINT "RoomBooking_no_overlap"
  EXCLUDE USING gist (
    "roomId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("status" = 'CONFIRMED');

-- Seed the two initial rooms (idempotent)
INSERT INTO "MeetingRoom" ("id", "name", "description", "location", "capacity", "isActive", "createdAt", "updatedAt")
VALUES
  ('room_boardroom_1', 'Boardroom 1', 'Bookable meeting room', NULL, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('room_boardroom_2', 'Boardroom 2', 'Bookable meeting room', NULL, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

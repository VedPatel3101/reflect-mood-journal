-- AlterTable: AI mood detection metadata on journal entries
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "detectedExpression" TEXT;
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "detectionConfidence" DOUBLE PRECISION;
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "moodSource" TEXT NOT NULL DEFAULT 'manual';

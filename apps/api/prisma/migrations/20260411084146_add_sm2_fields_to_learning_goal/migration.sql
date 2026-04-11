/*
  Warnings:

  - Made the column `nextReviewAt` on table `LearningGoal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "LearningGoal" ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "repetitions" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "nextReviewAt" SET NOT NULL;

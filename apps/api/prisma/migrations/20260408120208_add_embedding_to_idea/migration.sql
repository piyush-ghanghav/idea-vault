CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "Idea" ADD COLUMN "embedding" vector(384);
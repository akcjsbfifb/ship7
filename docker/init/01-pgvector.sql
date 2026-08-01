-- Enable pgvector on first boot (also ensured by Prisma migration)
CREATE EXTENSION IF NOT EXISTS vector;

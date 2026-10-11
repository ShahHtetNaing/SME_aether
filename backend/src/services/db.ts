import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./prisma/aether.db";
}

export const prisma = new PrismaClient();
export const databaseReady = Boolean(process.env.DATABASE_URL);

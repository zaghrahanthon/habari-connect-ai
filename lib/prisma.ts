// Reusable Prisma client — used by API routes and server actions
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
  connectionString: string | undefined;
};

function createPrismaClient(connectionString: string): PrismaClient {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  globalForPrisma.pool = pool;

  return new PrismaClient({ adapter });
}

/** Detect stale cached client from before schema updates (missing new models) */
function isClientReady(client: PrismaClient): boolean {
  return (
    typeof client.sectionItem !== "undefined" &&
    typeof client.resource !== "undefined" &&
    typeof client.newsPost !== "undefined" &&
    typeof client.quickContact !== "undefined" &&
    typeof client.peopleProfile !== "undefined"
  );
}

function getPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing. Copy .env.example to .env and set your PostgreSQL connection string.",
    );
  }

  const cached = globalForPrisma.prisma;

  if (
    cached &&
    isClientReady(cached) &&
    globalForPrisma.connectionString === connectionString
  ) {
    return cached;
  }

  // Drop stale pool when DATABASE_URL changes (e.g. after editing .env in dev)
  if (globalForPrisma.pool) {
    void globalForPrisma.pool.end();
    globalForPrisma.pool = undefined;
  }

  const client = createPrismaClient(connectionString);

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.connectionString = connectionString;
  }

  return client;
}

export const prisma = getPrismaClient();

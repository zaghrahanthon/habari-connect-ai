// Prisma 7 requires database URL in this config file (not in schema.prisma)
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Fallback allows `prisma generate` before .env is configured
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:password@localhost:5432/habari_connect_ai",
  },
});

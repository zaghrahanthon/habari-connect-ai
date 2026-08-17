/**
 * Backfill existing resources: extract PDF text and publish drafts with files.
 * Run: npm run db:backfill-resources
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { extractTextFromUpload } from "../lib/file-extract";
import { KNOWLEDGE_CATEGORIES } from "../lib/categories";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const resources = await prisma.resource.findMany({
    where: { fileUrl: { not: null } },
  });

  if (resources.length === 0) {
    console.log("No resources with files found.");
    return;
  }

  for (const resource of resources) {
    if (!resource.fileUrl) continue;

    const extractedText =
      resource.extractedText ??
      (await extractTextFromUpload(resource.fileUrl)) ??
      undefined;

    await prisma.resource.update({
      where: { id: resource.id },
      data: {
        extractedText,
        isPublished: true,
        isAiVisible: true,
        isEmployeeVisible: true,
        category: (KNOWLEDGE_CATEGORIES as readonly string[]).includes(
          resource.category,
        )
          ? resource.category
          : "Resources & Tools",
      },
    });

    console.log(
      `✅ ${resource.title} — published, ${extractedText?.length ?? 0} chars indexed`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

/**
 * Ingest public habarimedia.com content into the AI knowledge base.
 *
 * Pulls WordPress pages + posts via the public REST API, cleans Avada/Fusion
 * markup noise, and upserts published KnowledgeItems (matched by sourceUrl).
 *
 * Run: npm run db:ingest-website
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const BASE = "https://habarimedia.com";
const WP = `${BASE}/wp-json/wp/v2`;

const SKIP_SLUGS = new Set([
  "test",
  "compleat-golfer-clone",
  "logo-collection",
  "mysteriously-my-girlfriend",
  "my-phone",
  "hello-brooklyn",
  "merrel-in-brooklyn",
  "bmw-motorbike",
  "village-n-life",
  "deal-page",
  "daddys-deals-home-page",
]);

const MIN_CONTENT_CHARS = 80;

type WpRendered = { rendered: string };
type WpItem = {
  id: number;
  slug: string;
  link: string;
  title: WpRendered;
  content: WpRendered;
  excerpt?: WpRendered;
  type?: string;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env first.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/&[a-z]+;/gi, " ");
}

function htmlToText(html: string): string {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Avada / Revolution Slider noise that often leaks outside <style>
  s = s.replace(/@media[^{]+\{(?:[^{}]|\{[^{}]*\})*\}/gi, " ");
  s = s.replace(/\.fusion-[^{]+\{[^}]*\}/gi, " ");
  s = s.replace(/\.fusion-body[^{]+\{[^}]*\}/gi, " ");
  s = s.replace(/setREVStartSize\([\s\S]*?\);/gi, " ");
  s = s.replace(/revinit_\w+\([\s\S]*?\}\s*\}/gi, " ");
  s = s.replace(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\n\}/gi, " ");
  s = s.replace(/var\s+\w+\s*=\s*[^;]+;/gi, " ");
  s = s.replace(/jQuery\([\s\S]*?\}\);/gi, " ");

  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, "\n");
  s = s.replace(/<li[^>]*>/gi, "• ");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);

  return s
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => {
      if (line.length < 2) return false;
      if (/^(volume_off|volume_up|anemptytext)$/i.test(line)) return false;
      if (
        /[{};]/.test(line) &&
        /px|margin|padding|width|fusion|revapi|!important/i.test(line)
      ) {
        return false;
      }
      if (/^(Full Name|Company|Email Address|Message|Magazine)\*?$/i.test(line)) {
        return false;
      }
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanTitle(title: string): string {
  return decodeEntities(title.replace(/<[^>]+>/g, "")).trim();
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    let path = u.pathname.replace(/\/+/g, "/");
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return `${u.origin}${path || "/"}`;
  } catch {
    return url;
  }
}

function categorize(item: WpItem): string {
  const path = new URL(item.link).pathname.toLowerCase();
  const slug = item.slug.toLowerCase();

  if (
    path === "/" ||
    slug.includes("about") ||
    slug === "bbbee" ||
    slug === "clients"
  ) {
    return "About Us";
  }
  if (path.startsWith("/brands") || slug.includes("brand")) {
    return "Marketing";
  }
  if (
    path.startsWith("/solutions") ||
    slug.includes("advertis") ||
    slug === "mazda" ||
    slug === "isuzu"
  ) {
    return "Marketing";
  }
  if (path.startsWith("/careers") || /intern|sales-executive|contractor/.test(slug)) {
    return "People & Culture";
  }
  if (
    slug.includes("terms") ||
    slug.includes("conditions") ||
    slug.includes("policy")
  ) {
    return "Policies";
  }
  return "General";
}

async function fetchAll(endpoint: string): Promise<WpItem[]> {
  const items: WpItem[] = [];
  let page = 1;

  while (true) {
    const url = `${endpoint}?per_page=100&page=${page}&_fields=id,slug,link,title,content,excerpt`;
    const res = await fetch(url);
    if (res.status === 400 || res.status === 404) break;
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    const batch = (await res.json()) as WpItem[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    items.push(...batch);
    const totalPages = Number(res.headers.get("x-wp-totalpages") || "1");
    if (page >= totalPages) break;
    page += 1;
  }

  return items;
}

async function upsertKnowledge(item: {
  title: string;
  category: string;
  content: string;
  sourceUrl: string;
}): Promise<"created" | "updated" | "skipped"> {
  const existing = await prisma.knowledgeItem.findFirst({
    where: { sourceUrl: item.sourceUrl },
  });

  if (existing) {
    if (
      existing.title === item.title &&
      existing.category === item.category &&
      existing.content === item.content &&
      existing.isPublished &&
      existing.isAiVisible
    ) {
      return "skipped";
    }

    await prisma.knowledgeItem.update({
      where: { id: existing.id },
      data: {
        title: item.title,
        category: item.category,
        content: item.content,
        isPublished: true,
        isAiVisible: true,
        isEmployeeVisible: true,
      },
    });
    return "updated";
  }

  await prisma.knowledgeItem.create({
    data: {
      title: item.title,
      category: item.category,
      content: item.content,
      sourceUrl: item.sourceUrl,
      isPublished: true,
      isAiVisible: true,
      isEmployeeVisible: true,
    },
  });
  return "created";
}

async function main() {
  console.log("Fetching pages and posts from habarimedia.com…");
  const [pages, posts] = await Promise.all([
    fetchAll(`${WP}/pages`),
    fetchAll(`${WP}/posts`),
  ]);

  const seen = new Set<string>();
  const candidates = [...pages, ...posts].filter((item) => {
    if (SKIP_SLUGS.has(item.slug)) return false;
    const url = normalizeUrl(item.link);
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  console.log(`Found ${candidates.length} unique URLs to process.\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let empty = 0;

  for (const item of candidates) {
    const sourceUrl = normalizeUrl(item.link);
    const title = cleanTitle(item.title.rendered) || item.slug;
    const content = htmlToText(item.content.rendered);
    const category = categorize(item);

    if (content.length < MIN_CONTENT_CHARS) {
      console.log(`⏭️  skip (too little text): ${title} — ${sourceUrl}`);
      empty += 1;
      continue;
    }

    const result = await upsertKnowledge({
      title,
      category,
      content,
      sourceUrl,
    });

    if (result === "created") created += 1;
    else if (result === "updated") updated += 1;
    else skipped += 1;

    console.log(
      `${result === "created" ? "✅" : result === "updated" ? "🔄" : "•"} [${category}] ${title} (${content.length} chars)`,
    );
  }

  console.log("\nDone.");
  console.log(`  created: ${created}`);
  console.log(`  updated: ${updated}`);
  console.log(`  unchanged: ${skipped}`);
  console.log(`  empty/skipped: ${empty}`);
  console.log(
    "\nThe AI chat will use these Knowledge items automatically (published + AI visible).",
  );
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

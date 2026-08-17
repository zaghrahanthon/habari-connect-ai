/**
 * Seed script — creates the first admin user.
 *
 * WARNING: Change the default password before production!
 *
 * Run: npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:password@localhost:5432/habari_connect_ai";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@habarimedia.com";
  const plainPassword = "Admin123!";

  // WARNING: Admin123! is for local development only — change before production!
  const password = await bcrypt.hash(plainPassword, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      password,
      role: "admin",
      isActive: true,
      firstName: "Admin",
      lastName: "User",
    },
    create: {
      email,
      password,
      role: "admin",
      isActive: true,
      firstName: "Admin",
      lastName: "User",
    },
  });

  console.log("✅ Admin user ready:");
  console.log("   Email:    admin@habarimedia.com");
  console.log("   Password: Admin123!  (CHANGE BEFORE PRODUCTION)");
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

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "admin@123";
const ADMIN_COUNT = 5;

async function main() {
  const emails = Array.from(
    { length: ADMIN_COUNT },
    (_, i) => process.env[`ADMIN_EMAIL_${i + 1}`] ?? `admin${i + 1}@srmist.edu.in`
  );
  const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);

  for (const email of emails) {
    await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN", passwordHash },
      create: { email, role: "ADMIN", passwordHash },
    });
  }

  console.warn(
    `Faculty/admin accounts seeded for: ${emails.join(", ")} - change passwords after first login.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

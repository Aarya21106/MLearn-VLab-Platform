import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DUMMY_ADMIN_PASSWORD = "admin@123";

async function main() {
  const email1 = process.env.ADMIN_EMAIL_1 ?? "admin1@srmist.edu.in";
  const email2 = process.env.ADMIN_EMAIL_2 ?? "admin2@srmist.edu.in";
  const passwordHash = bcrypt.hashSync(DUMMY_ADMIN_PASSWORD, 10);

  for (const email of [email1, email2]) {
    await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN", passwordHash },
      create: { email, role: "ADMIN", passwordHash },
    });
  }

  console.warn(
    "Dummy admin credentials seeded - disable ENABLE_DUMMY_ADMIN_AUTH before any real deployment."
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

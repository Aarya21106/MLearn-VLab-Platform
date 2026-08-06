import { PrismaClient } from "@prisma/client";
import { experiments } from "./experiments-data";

const prisma = new PrismaClient();

async function main() {
  for (const exp of experiments) {
    await prisma.experiment.upsert({
      where: { orderIndex: exp.orderIndex },
      update: exp,
      create: exp,
    });
    console.log(`seeded #${exp.orderIndex} ${exp.title}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

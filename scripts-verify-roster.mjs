import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const admin = await prisma.user.findUnique({ where: { email: "admin1@srmist.edu.in" } });
console.log("admin1 row:", admin);
if (admin?.passwordHash) {
  console.log("bcrypt.compare('admin@123', hash):", await bcrypt.compare("admin@123", admin.passwordHash));
}
await prisma.$disconnect();

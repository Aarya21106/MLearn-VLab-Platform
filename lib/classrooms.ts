import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generatePassword } from "@/lib/password";
import type { RosterRow, CredentialsRow } from "@/lib/roster-excel";

export async function createClassroom(name: string, adminId: string) {
  return prisma.classroom.create({
    data: { name, createdById: adminId },
  });
}

export async function listClassrooms() {
  const classrooms = await prisma.classroom.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { students: true } } },
  });
  return classrooms;
}

export async function getClassroomWithRoster(id: string) {
  return prisma.classroom.findUnique({
    where: { id },
    include: {
      students: {
        orderBy: { registerNumber: "asc" },
      },
    },
  });
}

/**
 * Creates a new student account (with a freshly generated password) for
 * every registration number not already in the system, and re-homes /
 * updates name+section for ones that already exist. Existing students keep
 * their current password - a re-upload of a corrected sheet shouldn't
 * silently invalidate a password already handed out.
 *
 * Not wrapped in a single DB transaction: password hashing is CPU-bound and
 * a real roster (60+ rows) blows past Prisma's 5s interactive-transaction
 * timeout if it's all done inside one. Per-row failure here is recoverable
 * by re-uploading, so atomicity across the whole sheet isn't required.
 */
export async function applyRosterUpload(
  classroomId: string,
  rows: RosterRow[]
): Promise<CredentialsRow[]> {
  const existingUsers = await prisma.user.findMany({
    where: { registerNumber: { in: rows.map((r) => r.registerNumber) } },
  });
  const existingByRegNo = new Map(existingUsers.map((u) => [u.registerNumber!, u]));

  const newPasswordByRegNo = new Map<string, string>();
  const newUserData: {
    registerNumber: string;
    name: string;
    section: string;
    classroomId: string;
    role: "STUDENT";
    passwordHash: string;
  }[] = [];

  for (const row of rows) {
    if (existingByRegNo.has(row.registerNumber)) continue;
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);
    newPasswordByRegNo.set(row.registerNumber, password);
    newUserData.push({
      registerNumber: row.registerNumber,
      name: row.name,
      section: row.section,
      classroomId,
      role: "STUDENT",
      passwordHash,
    });
  }

  await Promise.all([
    ...rows
      .filter((row) => existingByRegNo.has(row.registerNumber))
      .map((row) =>
        prisma.user.update({
          where: { id: existingByRegNo.get(row.registerNumber)!.id },
          data: { name: row.name, section: row.section, classroomId },
        })
      ),
    newUserData.length > 0 ? prisma.user.createMany({ data: newUserData }) : Promise.resolve(),
  ]);

  return rows.map((row) => ({
    ...row,
    password: newPasswordByRegNo.get(row.registerNumber) ?? null,
  }));
}

export async function regenerateStudentPassword(studentId: string): Promise<string> {
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: studentId },
    data: { passwordHash },
  });
  return password;
}

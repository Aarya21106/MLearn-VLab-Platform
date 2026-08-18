"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { createClassroom, regenerateStudentPassword } from "@/lib/classrooms";
import { prisma } from "@/lib/prisma";

export async function createClassroomAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Classroom name is required.");

  const classroom = await createClassroom(name, admin.id);
  revalidatePath("/admin");
  return classroom.id;
}

export async function regeneratePasswordAction(studentId: string): Promise<string> {
  await requireAdmin();

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== "STUDENT") throw new Error("Student not found.");

  const password = await regenerateStudentPassword(studentId);
  if (student.classroomId) revalidatePath(`/admin/classrooms/${student.classroomId}`);
  return password;
}

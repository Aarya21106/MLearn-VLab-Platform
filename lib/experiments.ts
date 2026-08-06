import "server-only";
import { prisma } from "@/lib/prisma";

export async function getAllExperiments() {
  return prisma.experiment.findMany({ orderBy: { orderIndex: "asc" } });
}

export async function getExperimentByOrderIndex(orderIndex: number) {
  return prisma.experiment.findUnique({ where: { orderIndex } });
}

/** Order indexes the given user has fully completed (status COMPLETED on any attempt). */
export async function getCompletedOrderIndexes(userId: string): Promise<Set<number>> {
  const rows = await prisma.submission.findMany({
    where: { userId, status: "COMPLETED" },
    select: { experiment: { select: { orderIndex: true } } },
  });
  return new Set(rows.map((r) => r.experiment.orderIndex));
}

/** Experiment N is unlocked if N === 1 or experiment N-1 has been completed. */
export function isUnlocked(orderIndex: number, completed: Set<number>): boolean {
  return orderIndex === 1 || completed.has(orderIndex - 1);
}

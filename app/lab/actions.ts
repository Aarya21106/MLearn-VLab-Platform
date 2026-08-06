"use server";

import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/** Autosaves in-progress notebook state (code + outputs) on every successful
 * run, so admins can see in-progress work, not just final submissions.
 * Never overwrites an already-COMPLETED submission - that's the Phase 6
 * submit pipeline's job, using a fresh attempt instead. */
export async function saveNotebookProgress(experimentId: string, code: string, outputLog: string) {
  const user = await requireUser();

  const existing = await prisma.submission.findFirst({
    where: { userId: user.id, experimentId },
    orderBy: { attemptNumber: "desc" },
  });

  if (existing) {
    if (existing.status === "COMPLETED") return;
    await prisma.submission.update({
      where: { id: existing.id },
      data: { code, outputLog, status: "IN_PROGRESS" },
    });
  } else {
    await prisma.submission.create({
      data: {
        userId: user.id,
        experimentId,
        code,
        outputLog,
        status: "IN_PROGRESS",
        attemptNumber: 1,
      },
    });
  }

  await prisma.activityEvent.create({
    data: { userId: user.id, type: "cell_run", experimentId },
  });
}

export type AutograderReport = {
  score: number;
  passed_checks: string[];
  failed_checks: string[];
  message: string;
};

/** Persists a real submit: re-run all cells + autograder in a clean
 * namespace happens client-side (Pyodide), this just records the result.
 * COMPLETED unlocks the next experiment; FAILED_CHECKS does not. */
export async function submitExperiment(
  experimentId: string,
  code: string,
  outputLog: string,
  report: AutograderReport
) {
  const user = await requireUser();

  const status = report.score > 0 && report.failed_checks.length === 0 ? "COMPLETED" : "FAILED_CHECKS";

  const existing = await prisma.submission.findFirst({
    where: { userId: user.id, experimentId },
    orderBy: { attemptNumber: "desc" },
  });

  if (!existing) {
    await prisma.submission.create({
      data: {
        userId: user.id,
        experimentId,
        code,
        outputLog,
        status,
        score: report.score,
        autograderReport: JSON.stringify(report),
        attemptNumber: 1,
        submittedAt: new Date(),
      },
    });
  } else if (existing.status === "COMPLETED") {
    // Preserve grading history - a resubmission after an already-completed
    // experiment gets its own attempt row instead of overwriting the record.
    await prisma.submission.create({
      data: {
        userId: user.id,
        experimentId,
        code,
        outputLog,
        status,
        score: report.score,
        autograderReport: JSON.stringify(report),
        attemptNumber: existing.attemptNumber + 1,
        submittedAt: new Date(),
      },
    });
  } else {
    await prisma.submission.update({
      where: { id: existing.id },
      data: {
        code,
        outputLog,
        status,
        score: report.score,
        autograderReport: JSON.stringify(report),
        submittedAt: new Date(),
      },
    });
  }

  await prisma.activityEvent.create({
    data: { userId: user.id, type: "submit", experimentId, metadata: { score: report.score, status } },
  });

  return { status, score: report.score };
}

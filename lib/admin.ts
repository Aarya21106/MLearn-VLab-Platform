import "server-only";
import { prisma } from "@/lib/prisma";
import { displayNameOf } from "@/lib/display-name";

export async function getOverviewStats() {
  const [students, submissions, totalExperiments] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } }),
    prisma.submission.findMany({
      select: { userId: true, experimentId: true, status: true, score: true },
    }),
    prisma.experiment.count(),
  ]);

  const byStudent = new Map<string, { started: boolean; completedExpIds: Set<string>; scores: number[] }>();
  for (const s of students) byStudent.set(s.id, { started: false, completedExpIds: new Set(), scores: [] });

  for (const sub of submissions) {
    const entry = byStudent.get(sub.userId);
    if (!entry) continue;
    entry.started = true;
    if (sub.status === "COMPLETED") {
      entry.completedExpIds.add(sub.experimentId);
      if (sub.score != null) entry.scores.push(sub.score);
    }
  }

  const totalStudents = students.length;
  const startedCount = [...byStudent.values()].filter((e) => e.started).length;
  const completionPcts = [...byStudent.values()].map((e) =>
    totalExperiments ? e.completedExpIds.size / totalExperiments : 0
  );
  const avgCompletionPct = totalStudents
    ? (completionPcts.reduce((a, b) => a + b, 0) / totalStudents) * 100
    : 0;

  const allScores = [...byStudent.values()].flatMap((e) => e.scores);
  const avgScore = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

  return { totalStudents, startedCount, avgCompletionPct, avgScore, totalExperiments };
}

export type LeaderboardRow = {
  id: string;
  name: string;
  email: string;
  completedCount: number;
  totalScore: number;
  avgTimeSeconds: number;
};

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const [students, submissions] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true, displayName: true },
    }),
    prisma.submission.findMany({
      select: { userId: true, experimentId: true, status: true, score: true, timeSpentSeconds: true },
    }),
  ]);

  const byStudent = new Map(
    students.map((s) => [
      s.id,
      {
        ...s,
        bestScoreByExperiment: new Map<string, number>(),
        timeSamples: [] as number[],
      },
    ])
  );

  for (const sub of submissions) {
    const entry = byStudent.get(sub.userId);
    if (!entry) continue;
    entry.timeSamples.push(sub.timeSpentSeconds);
    if (sub.status === "COMPLETED" && sub.score != null) {
      const prevBest = entry.bestScoreByExperiment.get(sub.experimentId) ?? -1;
      if (sub.score > prevBest) entry.bestScoreByExperiment.set(sub.experimentId, sub.score);
    }
  }

  return [...byStudent.values()]
    .map((e) => ({
      id: e.id,
      name: displayNameOf(e),
      email: e.email,
      completedCount: e.bestScoreByExperiment.size,
      totalScore: [...e.bestScoreByExperiment.values()].reduce((a, b) => a + b, 0),
      avgTimeSeconds: e.timeSamples.length
        ? Math.round(e.timeSamples.reduce((a, b) => a + b, 0) / e.timeSamples.length)
        : 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);
}

export async function getExperimentStats(experimentId: string) {
  const [experiment, students, submissions] = await Promise.all([
    prisma.experiment.findUnique({ where: { id: experimentId } }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true, displayName: true },
    }),
    prisma.submission.findMany({
      where: { experimentId },
      select: { userId: true, status: true, score: true, timeSpentSeconds: true },
    }),
  ]);

  if (!experiment) return null;

  const studentIdsWithAnySubmission = new Set(submissions.map((s) => s.userId));
  const completedScores = submissions
    .filter((s) => s.status === "COMPLETED" && s.score != null)
    .map((s) => s.score as number);
  const completedStudentIds = new Set(
    submissions.filter((s) => s.status === "COMPLETED").map((s) => s.userId)
  );
  const times = submissions.map((s) => s.timeSpentSeconds).filter((t) => t > 0);

  const completionRate = students.length ? (completedStudentIds.size / students.length) * 100 : 0;
  const avgScore = completedScores.length
    ? completedScores.reduce((a, b) => a + b, 0) / completedScores.length
    : 0;
  const avgTimeSeconds = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  // Score histogram in 10-point buckets, 0-100.
  const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${i * 10 + 9}`, count: 0 }));
  for (const score of completedScores) {
    const idx = Math.min(9, Math.floor(score / 10));
    buckets[idx].count += 1;
  }

  const notStarted = students.filter((s) => !studentIdsWithAnySubmission.has(s.id));

  return {
    experiment,
    completionRate,
    avgScore,
    avgTimeSeconds,
    histogram: buckets,
    notStarted,
    totalStudents: students.length,
  };
}

export async function getStudentDetail(userId: string) {
  const [user, experiments, submissions, events] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.experiment.findMany({ orderBy: { orderIndex: "asc" } }),
    prisma.submission.findMany({
      where: { userId },
      orderBy: [{ experimentId: "asc" }, { attemptNumber: "desc" }],
    }),
    prisma.activityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  if (!user) return null;

  // Latest attempt per experiment (submissions already ordered attemptNumber desc within each experiment group).
  const latestByExperiment = new Map<string, (typeof submissions)[number]>();
  for (const sub of submissions) {
    if (!latestByExperiment.has(sub.experimentId)) latestByExperiment.set(sub.experimentId, sub);
  }

  const rows = experiments.map((exp) => ({
    experiment: exp,
    submission: latestByExperiment.get(exp.id) ?? null,
  }));

  return { user, rows, events };
}

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getAllExperiments } from "@/lib/experiments";
import { displayNameOf } from "@/lib/display-name";

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  await requireAdmin();

  const [students, experiments, submissions] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { registerNumber: "asc" } }),
    getAllExperiments(),
    prisma.submission.findMany({
      select: { userId: true, experimentId: true, status: true, score: true, timeSpentSeconds: true },
    }),
  ]);

  // Best (highest-scoring) completed attempt per (user, experiment).
  const best = new Map<string, { score: number; timeSpentSeconds: number; status: string }>();
  for (const sub of submissions) {
    const key = `${sub.userId}:${sub.experimentId}`;
    const existing = best.get(key);
    const score = sub.score ?? 0;
    if (!existing || score > existing.score) {
      best.set(key, { score, timeSpentSeconds: sub.timeSpentSeconds, status: sub.status });
    }
  }

  const header = [
    "Name",
    "Registration Number",
    "Section",
    ...experiments.flatMap((e) => [`${e.title} Score`, `${e.title} Time (s)`, `${e.title} Status`]),
    "Total Score",
    "Completed Count",
  ];

  const rows = students.map((student) => {
    let totalScore = 0;
    let completedCount = 0;
    const perExperiment = experiments.flatMap((exp) => {
      const entry = best.get(`${student.id}:${exp.id}`);
      if (entry?.status === "COMPLETED") {
        totalScore += entry.score;
        completedCount += 1;
      }
      return [entry?.score ?? "", entry?.timeSpentSeconds ?? "", entry?.status ?? "NOT_STARTED"];
    });
    return [
      displayNameOf(student),
      student.registerNumber ?? "",
      student.section ?? "",
      ...perExperiment,
      totalScore,
      completedCount,
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mlearn-grades-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

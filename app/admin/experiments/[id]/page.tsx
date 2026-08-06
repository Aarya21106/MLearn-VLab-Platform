import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth-helpers";
import { getExperimentStats } from "@/lib/admin";
import { ScoreHistogram } from "@/components/score-histogram";
import { displayNameOf } from "@/lib/display-name";

export default async function AdminExperimentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const stats = await getExperimentStats(id);
  if (!stats) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Overview
      </Link>
      <h1 className="mt-2 mb-6 text-xl font-semibold text-foreground">
        {stats.experiment.orderIndex}. {stats.experiment.title}
      </h1>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Completion rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.completionRate.toFixed(0)}%</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Average score</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.avgScore.toFixed(0)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Average time</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {Math.floor(stats.avgTimeSeconds / 60)}m {stats.avgTimeSeconds % 60}s
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Score distribution</h2>
      <div className="mb-8 rounded-lg border border-border p-4">
        <ScoreHistogram data={stats.histogram} />
      </div>

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        Not yet started ({stats.notStarted.length} of {stats.totalStudents})
      </h2>
      <div className="rounded-lg border border-border">
        {stats.notStarted.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Every student has started this experiment.</p>
        ) : (
          <ul className="divide-y divide-border">
            {stats.notStarted.map((s) => (
              <li key={s.id} className="px-4 py-2 text-sm">
                <Link href={`/admin/students/${s.id}`} className="hover:underline">
                  {displayNameOf(s)}
                </Link>
                <span className="ml-2 text-muted-foreground">{s.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

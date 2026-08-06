import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Zap } from "lucide-react";
import { requireAdmin } from "@/lib/auth-helpers";
import { getOverviewStats, getLeaderboard } from "@/lib/admin";
import { getAllExperiments } from "@/lib/experiments";
import { LeaderboardTable } from "@/components/leaderboard-table";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [stats, leaderboard, experiments] = await Promise.all([
    getOverviewStats(),
    getLeaderboard(),
    getAllExperiments(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Overview</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/load-test">
            <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
              <Zap className="size-3.5 text-yellow-500 fill-yellow-500" />
              Performance Test
            </Button>
          </Link>
          <a href="/admin/export">
            <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
              <Download className="size-3.5" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Registered students
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.totalStudents}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Started at least one</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.startedCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Avg completion</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {stats.avgCompletionPct.toFixed(0)}%
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Avg score</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.avgScore.toFixed(0)}</CardContent>
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Leaderboard</h2>
      <div className="mb-8 rounded-lg border border-border">
        <LeaderboardTable rows={leaderboard} />
      </div>

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Experiments</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {experiments.map((exp) => (
          <Link
            key={exp.id}
            href={`/admin/experiments/${exp.id}`}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
          >
            {exp.orderIndex}. {exp.title}
          </Link>
        ))}
      </div>
    </main>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-helpers";
import { getClassroomWithRoster } from "@/lib/classrooms";
import { getOverviewStats, getLeaderboard } from "@/lib/admin";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { RosterUploadForm } from "@/components/roster-upload-form";
import { ResetPasswordButton } from "@/components/reset-password-button";

export default async function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const classroom = await getClassroomWithRoster(id);
  if (!classroom) notFound();

  const [stats, leaderboard] = await Promise.all([getOverviewStats(id), getLeaderboard(id)]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Classrooms
      </Link>
      <div className="mt-2 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{classroom.name}</h1>
          <p className="text-sm text-muted-foreground">
            Created {new Date(classroom.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/admin/classrooms/${id}/roster-template`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="size-3.5" />
              Download template
            </Button>
          </a>
          <RosterUploadForm classroomId={id} />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Students</CardTitle>
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

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Roster ({classroom.students.length})</h2>
      <div className="mb-8 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reg. No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classroom.students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <Link href={`/admin/students/${student.id}`} className="hover:underline">
                    {student.registerNumber}
                  </Link>
                </TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.section}</TableCell>
                <TableCell className="text-muted-foreground">
                  {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleString() : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <ResetPasswordButton
                    studentId={student.id}
                    registerNumber={student.registerNumber ?? ""}
                  />
                </TableCell>
              </TableRow>
            ))}
            {classroom.students.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No students yet - download the template and upload a filled roster.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Leaderboard</h2>
      <div className="rounded-lg border border-border">
        <LeaderboardTable rows={leaderboard} />
      </div>
    </main>
  );
}

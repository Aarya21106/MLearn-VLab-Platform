import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { getStudentDetail } from "@/lib/admin";
import { StudentSubmissionRow } from "@/components/student-submission-row";
import { displayNameOf } from "@/lib/display-name";

function formatEventType(type: string) {
  return type.replace("_", " ");
}

export default async function AdminStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getStudentDetail(id);
  if (!detail) notFound();

  const { user, rows, events } = detail;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Overview
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-foreground">{displayNameOf(user)}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{user.email}</p>

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Experiments</h2>
      <div className="mb-8 rounded-lg border border-border">
        {rows.map(({ experiment, submission }) => (
          <StudentSubmissionRow
            key={experiment.id}
            orderIndex={experiment.orderIndex}
            title={experiment.title}
            submission={submission}
          />
        ))}
      </div>

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Activity timeline</h2>
      <div className="rounded-lg border border-border">
        {events.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="capitalize">{formatEventType(event.type)}</span>
                <span className="text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

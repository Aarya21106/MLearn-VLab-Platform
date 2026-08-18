import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAllExperiments } from "@/lib/experiments";

export default async function AdminExperimentsPage() {
  await requireAdmin();
  const experiments = await getAllExperiments();

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Experiments</h1>
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
          ← Classrooms
        </Link>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Shared across every classroom — pick one to see completion stats across all students.
      </p>
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

import Link from "next/link";
import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth-helpers";
import { listClassrooms } from "@/lib/classrooms";
import { CreateClassroomForm } from "@/components/create-classroom-form";

export default async function AdminClassroomsPage() {
  await requireAdmin();
  const classrooms = await listClassrooms();

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Classrooms</h1>
        <Link href="/admin/experiments" className="text-sm text-muted-foreground hover:underline">
          All experiments →
        </Link>
      </div>

      <div className="mb-8 rounded-lg border border-border p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Create a classroom</h2>
        <CreateClassroomForm />
      </div>

      {classrooms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No classrooms yet. Create one above to start uploading a student roster.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {classrooms.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/classrooms/${c.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-accent"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-3.5" />
                  {c._count.students}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

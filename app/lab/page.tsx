import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getAllExperiments, getCompletedOrderIndexes, isUnlocked } from "@/lib/experiments";

export default async function LabIndexPage() {
  const user = await requireUser();
  const [experiments, completed] = await Promise.all([
    getAllExperiments(),
    getCompletedOrderIndexes(user.id),
  ]);

  const target =
    experiments.find((e) => isUnlocked(e.orderIndex, completed) && !completed.has(e.orderIndex)) ??
    experiments[0];

  if (target) redirect(`/lab/${target.orderIndex}`);

  redirect("/lab");
}

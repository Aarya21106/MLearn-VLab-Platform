import { DeviceGate } from "@/components/device-gate";
import { LabSidebar } from "@/components/lab-sidebar";
import { requireUser } from "@/lib/auth-helpers";
import { getAllExperiments, getCompletedOrderIndexes } from "@/lib/experiments";
import { displayNameOf } from "@/lib/display-name";

export default async function LabLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [experiments, completed] = await Promise.all([
    getAllExperiments(),
    getCompletedOrderIndexes(user.id),
  ]);

  return (
    <DeviceGate>
      <div className="flex h-screen overflow-hidden">
        <LabSidebar
          experiments={experiments.map((e) => ({ orderIndex: e.orderIndex, title: e.title }))}
          completedOrderIndexes={[...completed]}
          currentName={displayNameOf(user)}
        />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </DeviceGate>
  );
}

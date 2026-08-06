"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Lock, CircleCheck, Circle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { DisplayNameEditor } from "@/components/display-name-editor";

type SidebarExperiment = {
  orderIndex: number;
  title: string;
};

export function LabSidebar({
  experiments,
  completedOrderIndexes,
  currentName,
}: {
  experiments: SidebarExperiment[];
  completedOrderIndexes: number[];
  currentName: string;
}) {
  const pathname = usePathname();
  const completed = new Set(completedOrderIndexes);

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-muted/40">
      <div className="px-4 py-5">
        <span className="text-base font-semibold tracking-tight text-foreground">MLEARN</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <ul className="space-y-0.5">
          {experiments.map((exp) => {
            const isCompleted = completed.has(exp.orderIndex);
            const isUnlocked = exp.orderIndex === 1 || completed.has(exp.orderIndex - 1);
            const isSelected = pathname === `/lab/${exp.orderIndex}`;

            const rowClasses = cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              isSelected
                ? "bg-accent text-accent-foreground font-medium"
                : "text-foreground/80 hover:bg-accent/60",
              !isUnlocked && "text-muted-foreground/60"
            );

            const icon = isCompleted ? (
              <CircleCheck className="size-4 shrink-0 text-emerald-600" />
            ) : isUnlocked ? (
              <Circle className="size-4 shrink-0 fill-blue-500 text-blue-500" />
            ) : (
              <Lock className="size-4 shrink-0 text-muted-foreground/50" />
            );

            if (!isUnlocked) {
              return (
                <li key={exp.orderIndex}>
                  <button
                    type="button"
                    className={cn(rowClasses, "w-full text-left cursor-not-allowed")}
                    onClick={() =>
                      toast(`Complete Experiment ${exp.orderIndex - 1} first.`)
                    }
                  >
                    {icon}
                    <span className="truncate">
                      {exp.orderIndex}. {exp.title}
                    </span>
                  </button>
                </li>
              );
            }

            return (
              <li key={exp.orderIndex}>
                <Link href={`/lab/${exp.orderIndex}`} className={rowClasses}>
                  {icon}
                  <span className="truncate">
                    {exp.orderIndex}. {exp.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-3">
        <DisplayNameEditor currentName={currentName} />
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          title="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </aside>
  );
}

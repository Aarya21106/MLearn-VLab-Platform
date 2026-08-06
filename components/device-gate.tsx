"use client";

import { useViewportGate } from "@/hooks/use-viewport-gate";

export function DeviceGate({ children }: { children: React.ReactNode }) {
  const blocked = useViewportGate();

  if (blocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="text-lg font-medium text-foreground">
          MLEARN requires a laptop or desktop browser.
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Please switch devices to continue.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

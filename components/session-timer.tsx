"use client";

import { useExperimentSeconds } from "./experiment-timer-context";

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SessionTimer() {
  const seconds = useExperimentSeconds();

  return (
    <span className="font-mono text-sm tabular-nums text-muted-foreground">
      {formatTime(seconds)}
    </span>
  );
}


"use client";

import { useEffect, useState } from "react";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Ticks up from 0. Pass a `key={experimentId}` at the call site to reset the
 * timer on experiment switch - that remounts this component instead of
 * needing an effect to reset state. */
export function SessionTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-sm tabular-nums text-muted-foreground">
      {formatTime(seconds)}
    </span>
  );
}

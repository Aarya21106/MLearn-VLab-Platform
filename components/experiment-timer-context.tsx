"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from "react";

// Split into two contexts on purpose: `seconds` changes every second (for the
// visible ticking display), while `getSeconds` is a stable function reference
// that never changes. Components that only need getSeconds (like Notebook,
// which wraps several Monaco editor instances) must not re-render every
// second just because a sibling display value ticked.
const SecondsContext = createContext<number>(0);
const GetSecondsContext = createContext<() => number>(() => 0);

export function ExperimentTimerProvider({
  experimentId,
  initialSeconds = 0,
  children,
}: {
  experimentId: string;
  initialSeconds?: number;
  children: React.ReactNode;
}) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const secondsRef = useRef(initialSeconds);

  useEffect(() => {
    secondsRef.current = initialSeconds;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        secondsRef.current = next;
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [experimentId, initialSeconds]);

  const getSeconds = useMemo(() => () => secondsRef.current, []);

  return (
    <GetSecondsContext.Provider value={getSeconds}>
      <SecondsContext.Provider value={seconds}>{children}</SecondsContext.Provider>
    </GetSecondsContext.Provider>
  );
}

/** Ticking seconds value - re-renders every second. Only use for display (e.g. SessionTimer). */
export function useExperimentSeconds() {
  return useContext(SecondsContext);
}

/** Stable getter for the current elapsed seconds - never changes reference, never causes a re-render. */
export function useGetExperimentSeconds() {
  return useContext(GetSecondsContext);
}

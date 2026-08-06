"use client";

import { useSyncExternalStore } from "react";

const MIN_WIDTH = 1024;
const MOBILE_UA_PATTERN = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i;

function getSnapshot() {
  const tooNarrow = window.innerWidth < MIN_WIDTH;
  const mobileUa = MOBILE_UA_PATTERN.test(window.navigator.userAgent);
  return tooNarrow || mobileUa;
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  let timeout: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(timeout);
    timeout = setTimeout(callback, 150);
  };
  window.addEventListener("resize", onResize);
  return () => {
    window.removeEventListener("resize", onResize);
    clearTimeout(timeout);
  };
}

/** Blocks phones/narrow viewports - re-checked on resize so shrinking a
 * desktop window down doesn't bypass the gate. */
export function useViewportGate() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

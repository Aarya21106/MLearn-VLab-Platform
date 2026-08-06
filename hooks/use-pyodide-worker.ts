"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type PyodideStatus = "loading" | "ready" | "error";

export type RunResult = {
  stdout: string;
  stderr: string;
  error: string | null;
  /** Base64-encoded PNGs (no data: prefix) of every matplotlib figure opened during the run. */
  figures: string[];
};

export type AutograderResult = {
  score: number;
  passed_checks: string[];
  failed_checks: string[];
  message: string;
};

export type SubmitResult = {
  stdout: string;
  stderr: string;
  error: string | null;
  result: AutograderResult | null;
};

type Pending<T> = {
  resolve: (result: T) => void;
};

let sharedWorker: Worker | null = null;
let sharedInitPromise: Promise<void> | null = null;

function getWorker(): Worker {
  if (!sharedWorker) {
    sharedWorker = new Worker("/pyodide-worker.js", { type: "module" });
  }
  return sharedWorker;
}

/** Loads the Pyodide worker once per page and exposes runCode()/loadDataset()/
 * submitRun(). The worker (loaded packages + persistent kernel globals) is
 * shared across every cell/experiment in the session so switching
 * experiments doesn't re-download numpy/pandas/etc, and cells see each
 * other's variables like a real notebook kernel. */
export function usePyodideWorker() {
  const [status, setStatus] = useState<PyodideStatus>("loading");
  const [progressMessage, setProgressMessage] = useState("Starting Python environment...");
  const pendingRuns = useRef(new Map<string, Pending<RunResult>>());
  const pendingSubmits = useRef(new Map<string, Pending<SubmitResult>>());
  const nextId = useRef(0);

  useEffect(() => {
    const worker = getWorker();

    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (data.type === "progress") {
        setProgressMessage(data.message);
      } else if (data.type === "ready") {
        setStatus("ready");
      } else if (data.type === "init-error") {
        setStatus("error");
        setProgressMessage(data.message);
      } else if (data.type === "result") {
        const pending = pendingRuns.current.get(data.id);
        if (pending) {
          pending.resolve({
            stdout: data.stdout,
            stderr: data.stderr,
            error: data.error,
            figures: data.figures ?? [],
          });
          pendingRuns.current.delete(data.id);
        }
      } else if (data.type === "submit-result") {
        const pending = pendingSubmits.current.get(data.id);
        if (pending) {
          pending.resolve({
            stdout: data.stdout,
            stderr: data.stderr,
            error: data.error,
            result: data.result,
          });
          pendingSubmits.current.delete(data.id);
        }
      }
    }

    worker.addEventListener("message", handleMessage);

    if (!sharedInitPromise) {
      sharedInitPromise = new Promise((resolve) => {
        const onReady = (event: MessageEvent) => {
          if (event.data.type === "ready" || event.data.type === "init-error") {
            worker.removeEventListener("message", onReady);
            resolve();
          }
        };
        worker.addEventListener("message", onReady);
        worker.postMessage({ type: "init" });
      });
    } else {
      // A previous hook instance already kicked off init; just reflect status.
      sharedInitPromise.then(() => setStatus((s) => (s === "error" ? s : "ready")));
    }

    return () => worker.removeEventListener("message", handleMessage);
  }, []);

  const runCode = useCallback((code: string): Promise<RunResult> => {
    const worker = getWorker();
    const id = String(nextId.current++);
    return new Promise((resolve) => {
      pendingRuns.current.set(id, { resolve });
      worker.postMessage({ type: "run", id, code });
    });
  }, []);

  const loadDataset = useCallback((filename: string, content: string): Promise<void> => {
    const worker = getWorker();
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "dataset-loaded" || event.data.type === "dataset-error") {
          worker.removeEventListener("message", handler);
          resolve();
        }
      };
      worker.addEventListener("message", handler);
      worker.postMessage({ type: "load-dataset", dataset: { filename, content } });
    });
  }, []);

  const submitRun = useCallback(
    (studentCode: string, autograderCode: string): Promise<SubmitResult> => {
      const worker = getWorker();
      const id = String(nextId.current++);
      return new Promise((resolve) => {
        pendingSubmits.current.set(id, { resolve });
        worker.postMessage({ type: "submit-run", id, studentCode, autograderCode });
      });
    },
    []
  );

  return { status, progressMessage, runCode, loadDataset, submitRun };
}

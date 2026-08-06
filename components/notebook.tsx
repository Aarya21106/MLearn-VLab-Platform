"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Play,
  PlayCircle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { usePyodideWorker, type RunResult } from "@/hooks/use-pyodide-worker";
import { saveNotebookProgress, submitExperiment } from "@/app/lab/actions";
import { useGetExperimentSeconds } from "@/components/experiment-timer-context";

type Cell = {
  id: string;
  code: string;
  output: RunResult | null;
  running: boolean;
};

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function storageKey(experimentId: string) {
  return `mlearn:notebook:${experimentId}`;
}

function loadFromStorage(experimentId: string, fallbackCode: string): Cell[] {
  if (typeof window === "undefined") return [{ id: genId(), code: fallbackCode, output: null, running: false }];
  try {
    const raw = window.localStorage.getItem(storageKey(experimentId));
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as { id: string; code: string }[];
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("invalid");
    return parsed.map((c) => ({ id: c.id, code: c.code, output: null, running: false }));
  } catch {
    return [{ id: genId(), code: fallbackCode, output: null, running: false }];
  }
}

type SubmitBannerState = {
  score: number;
  maxScore: number;
  passedChecks: string[];
  failedChecks: string[];
  message: string;
  fatalError: string | null;
};

export function Notebook({
  experimentId,
  starterCode,
  datasetUrl,
  autograderCode,
  maxScore,
}: {
  experimentId: string;
  starterCode: string;
  datasetUrl: string | null;
  autograderCode: string;
  maxScore: number;
}) {
  const router = useRouter();
  const { status, progressMessage, runCode, loadDataset, submitRun } = usePyodideWorker();
  const getSeconds = useGetExperimentSeconds();
  const [cells, setCells] = useState<Cell[]>(() => loadFromStorage(experimentId, starterCode));
  const [datasetReady, setDatasetReady] = useState(!datasetUrl);
  const [runningAll, setRunningAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitBanner, setSubmitBanner] = useState<SubmitBannerState | null>(null);

  useEffect(() => {
    if (status !== "ready" || !datasetUrl || datasetReady) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(datasetUrl);
      const content = await res.text();
      await loadDataset("data.csv", content);
      if (!cancelled) setDatasetReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [status, datasetUrl, datasetReady, loadDataset]);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey(experimentId),
      JSON.stringify(cells.map((c) => ({ id: c.id, code: c.code })))
    );
  }, [cells, experimentId]);

  const busy = status !== "ready" || (!!datasetUrl && !datasetReady);

  async function persistProgress(latestCells: Cell[]) {
    const code = JSON.stringify(latestCells.map((c) => ({ id: c.id, code: c.code })));
    const outputLog = JSON.stringify(
      latestCells.map((c) => ({ id: c.id, output: c.output }))
    );
    await saveNotebookProgress(experimentId, code, outputLog, getSeconds());
  }

  async function runCellAt(index: number, code: string) {
    if (busy) return;
    setCells((cs) => cs.map((c, i) => (i === index ? { ...c, running: true } : c)));
    const result = await runCode(code);
    const next = cells.map((c, i) => (i === index ? { ...c, running: false, output: result } : c));
    setCells(next);
    persistProgress(next);
  }

  async function runAll() {
    if (busy || runningAll) return;
    setRunningAll(true);
    const snapshot = cells;
    const results: RunResult[] = [];
    for (let i = 0; i < snapshot.length; i++) {
      setCells((cs) => cs.map((c, idx) => (idx === i ? { ...c, running: true } : c)));
      results[i] = await runCode(snapshot[i].code);
      setCells((cs) => cs.map((c, idx) => (idx === i ? { ...c, running: false, output: results[i] } : c)));
    }
    const finalCells = snapshot.map((c, i) => ({ ...c, running: false, output: results[i] }));
    setRunningAll(false);
    persistProgress(finalCells);
  }

  async function handleSubmit() {
    if (busy || submitting) return;
    setSubmitting(true);
    setSubmitBanner(null);

    const studentCode = cells.map((c) => c.code).join("\n\n");
    const { stdout, stderr, error, result } = await submitRun(studentCode, autograderCode);

    if (!result) {
      setSubmitBanner({
        score: 0,
        maxScore,
        passedChecks: [],
        failedChecks: [],
        message: "",
        fatalError: error ?? stderr ?? "The autograder did not produce a result.",
      });
      setSubmitting(false);
      return;
    }

    const banner: SubmitBannerState = {
      score: result.score,
      maxScore,
      passedChecks: result.passed_checks,
      failedChecks: result.failed_checks,
      message: result.message,
      fatalError: null,
    };
    setSubmitBanner(banner);

    const code = JSON.stringify(cells.map((c) => ({ id: c.id, code: c.code })));
    const outputLog = JSON.stringify({ stdout, stderr, result });
    try {
      await submitExperiment(experimentId, code, outputLog, result, getSeconds());
      router.refresh();
    } catch (err) {
      console.error("Failed to persist submission:", err);
      toast.error(
        "Your score was graded, but saving it failed - check your connection and submit again so the next experiment unlocks."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function updateCode(index: number, code: string) {
    setCells((cs) => cs.map((c, i) => (i === index ? { ...c, code } : c)));
  }

  function addCell(afterIndex: number) {
    setCells((cs) => {
      const next = [...cs];
      next.splice(afterIndex + 1, 0, { id: genId(), code: "", output: null, running: false });
      return next;
    });
  }

  function deleteCell(index: number) {
    setCells((cs) => (cs.length <= 1 ? cs : cs.filter((_, i) => i !== index)));
  }

  function moveCell(index: number, direction: -1 | 1) {
    setCells((cs) => {
      const target = index + direction;
      if (target < 0 || target >= cs.length) return cs;
      const next = [...cs];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {status === "loading" && progressMessage}
          {status === "error" && `Failed to start Python: ${progressMessage}`}
          {status === "ready" && datasetUrl && !datasetReady && "Loading dataset..."}
          {status === "ready" && datasetReady && !runningAll && "Ready"}
          {runningAll && "Running all cells..."}
        </span>
        <Button size="sm" variant="outline" onClick={runAll} disabled={busy || runningAll} className="gap-1.5">
          {runningAll ? <Loader2 className="size-3.5 animate-spin" /> : <PlayCircle className="size-3.5" />}
          Run all
        </Button>
      </div>

      {cells.map((cell, index) => (
        <div key={cell.id} className="overflow-hidden rounded-lg border border-border">
          <div className="border-b border-border">
            <Editor
              height="220px"
              defaultLanguage="python"
              value={cell.code}
              onChange={(value) => updateCode(index, value ?? "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          <div className="flex items-center justify-between bg-muted/40 px-3 py-1.5">
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => moveCell(index, -1)}
                disabled={index === 0}
                title="Move cell up"
              >
                <ChevronUp className="size-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => moveCell(index, 1)}
                disabled={index === cells.length - 1}
                title="Move cell down"
              >
                <ChevronDown className="size-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => addCell(index)}
                title="Add cell below"
              >
                <Plus className="size-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => deleteCell(index)}
                disabled={cells.length <= 1}
                title="Delete cell"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <Button
              size="sm"
              onClick={() => runCellAt(index, cell.code)}
              disabled={busy || cell.running || runningAll}
              className="gap-1.5"
            >
              {cell.running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
              Run
            </Button>
          </div>

          {cell.output && (
            <div className="space-y-2 border-t border-border bg-zinc-900 px-4 py-3 font-mono text-xs leading-relaxed">
              {cell.output.stdout && (
                <pre className="whitespace-pre-wrap text-zinc-100">{cell.output.stdout}</pre>
              )}
              {cell.output.stderr && (
                <pre className="whitespace-pre-wrap text-amber-400">{cell.output.stderr}</pre>
              )}
              {cell.output.error && (
                <pre className="whitespace-pre-wrap text-red-400">{cell.output.error}</pre>
              )}
              {cell.output.figures.map((fig, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={`data:image/png;base64,${fig}`}
                  alt={`Figure ${i + 1}`}
                  className="max-w-full rounded border border-zinc-700 bg-white"
                />
              ))}
              {!cell.output.stdout &&
                !cell.output.stderr &&
                !cell.output.error &&
                cell.output.figures.length === 0 && <span className="text-zinc-500">(no output)</span>}
            </div>
          )}
        </div>
      ))}

      {submitBanner && (
        <Alert variant={submitBanner.fatalError ? "destructive" : "default"}>
          {submitBanner.fatalError ? (
            <XCircle className="size-4" />
          ) : submitBanner.failedChecks.length === 0 ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <XCircle className="size-4" />
          )}
          {submitBanner.fatalError ? (
            <>
              <AlertTitle>Your code raised an error before grading could complete.</AlertTitle>
              <AlertDescription>
                <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">{submitBanner.fatalError}</pre>
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertTitle>
                Experiment executed successfully — Score: {submitBanner.score}/{submitBanner.maxScore}
              </AlertTitle>
              <AlertDescription>
                <p>{submitBanner.message}</p>
                {submitBanner.failedChecks.length > 0 && (
                  <ul className="mt-1 list-inside list-disc">
                    {submitBanner.failedChecks.map((check) => (
                      <li key={check}>{check}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSubmit} disabled={busy || submitting} className="gap-2">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Submit
        </Button>
      </div>
    </div>
  );
}

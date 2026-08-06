"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CellCode = { id: string; code: string };

function formatCode(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((c) => typeof c?.code === "string")) {
      return (parsed as CellCode[]).map((c, i) => `# --- Cell ${i + 1} ---\n${c.code}`).join("\n\n");
    }
  } catch {
    // not JSON - fall through to raw
  }
  return raw;
}

function formatOutputLog(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  FAILED_CHECKS: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  NOT_STARTED: "bg-muted text-muted-foreground",
};

export function StudentSubmissionRow({
  orderIndex,
  title,
  submission,
}: {
  orderIndex: number;
  title: string;
  submission: {
    status: string;
    score: number | null;
    timeSpentSeconds: number;
    code: string;
    outputLog: string;
    submittedAt: Date | string | null;
  } | null;
}) {
  const [open, setOpen] = useState(false);
  const status = submission?.status ?? "NOT_STARTED";

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={!submission}
        className="flex w-full items-center justify-between px-4 py-3 text-left disabled:cursor-default"
      >
        <div className="flex items-center gap-3">
          {submission ? (
            open ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )
          ) : (
            <span className="size-4" />
          )}
          <span className="text-sm font-medium">
            {orderIndex}. {title}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {submission && (
            <span className="text-muted-foreground">
              {Math.floor(submission.timeSpentSeconds / 60)}m {submission.timeSpentSeconds % 60}s
            </span>
          )}
          <span className="font-medium">{submission?.score ?? "—"}</span>
          <Badge className={STATUS_STYLES[status]} variant="secondary">
            {status.replace("_", " ")}
          </Badge>
        </div>
      </button>

      {open && submission && (
        <div className="space-y-3 border-t border-border bg-muted/20 px-4 py-4">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Code</p>
            <div className="overflow-hidden rounded-md border border-border">
              <Editor
                height="240px"
                defaultLanguage="python"
                value={formatCode(submission.code)}
                theme="vs-dark"
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
              />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Output log</p>
            <pre className="max-h-64 overflow-auto rounded-md border border-border bg-zinc-900 p-3 font-mono text-xs text-zinc-100">
              {formatOutputLog(submission.outputLog)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

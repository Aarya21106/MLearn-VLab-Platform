"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/markdown-content";

export function HintsPanel({ hintsMd }: { hintsMd: string }) {
  const hints = hintsMd
    .trim()
    .split(/\n\n+/)
    .filter(Boolean);
  const [revealed, setRevealed] = useState(1);

  return (
    <div className="space-y-4">
      {hints.slice(0, revealed).map((hint, i) => (
        <MarkdownContent key={i}>{hint}</MarkdownContent>
      ))}
      {revealed < hints.length && (
        <Button variant="outline" size="sm" onClick={() => setRevealed((r) => r + 1)}>
          Show next hint ({revealed}/{hints.length})
        </Button>
      )}
    </div>
  );
}

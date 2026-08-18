"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LeaderboardRow } from "@/lib/admin";

type SortKey = "name" | "completedCount" | "totalScore" | "avgTimeSeconds";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function SortableHead({
  label,
  sortKeyValue,
  onSort,
}: {
  label: string;
  sortKeyValue: SortKey;
  onSort: (key: SortKey) => void;
}) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(sortKeyValue)}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {label}
        <ArrowUpDown className="size-3" />
      </button>
    </TableHead>
  );
}

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("totalScore");
  const [descending, setDescending] = useState(true);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setDescending((d) => !d);
    } else {
      setSortKey(key);
      setDescending(true);
    }
  }

  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") {
      cmp = (a.name ?? a.registerNumber ?? "").localeCompare(b.name ?? b.registerNumber ?? "");
    } else {
      cmp = a[sortKey] - b[sortKey];
    }
    return descending ? -cmp : cmp;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Rank</TableHead>
          <SortableHead label="Student" sortKeyValue="name" onSort={toggleSort} />
          <SortableHead label="Completed" sortKeyValue="completedCount" onSort={toggleSort} />
          <SortableHead label="Total score" sortKeyValue="totalScore" onSort={toggleSort} />
          <SortableHead label="Avg time / experiment" sortKeyValue="avgTimeSeconds" onSort={toggleSort} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row, i) => (
          <TableRow key={row.id}>
            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
            <TableCell>
              <Link href={`/admin/students/${row.id}`} className="hover:underline">
                <div className="font-medium">{row.name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{row.registerNumber}</div>
              </Link>
            </TableCell>
            <TableCell>{row.completedCount}</TableCell>
            <TableCell>{row.totalScore}</TableCell>
            <TableCell>{formatTime(row.avgTimeSeconds)}</TableCell>
          </TableRow>
        ))}
        {sorted.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              No students yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

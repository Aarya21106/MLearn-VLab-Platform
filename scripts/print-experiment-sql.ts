import { experiments } from "../prisma/experiments-data";
import fs from "node:fs";
import path from "node:path";

function esc(v: string | null): string {
  if (v === null) return "NULL";
  return `'${v.replace(/'/g, "''")}'`;
}

const lines: string[] = [];
lines.push(
  `INSERT INTO public."Experiment" (id, "orderIndex", title, "syllabusUnit", "questionMd", "manualMd", "hintsMd", "starterCode", "datasetUrl", "datasetPreviewMd", "autograderCode", "maxScore", "estMinutes")`
);
lines.push("VALUES");

const rows = experiments.map((e) => {
  return `  (gen_random_uuid()::text, ${e.orderIndex}, ${esc(e.title)}, ${esc(e.syllabusUnit)}, ${esc(
    e.questionMd
  )}, ${esc(e.manualMd)}, ${esc(e.hintsMd)}, ${esc(e.starterCode)}, ${esc(e.datasetUrl)}, ${esc(
    e.datasetPreviewMd
  )}, ${esc(e.autograderCode)}, ${e.maxScore}, ${e.estMinutes})`;
});

lines.push(rows.join(",\n"));
lines.push(`ON CONFLICT ("orderIndex") DO UPDATE SET`);
lines.push(`  title = EXCLUDED.title,`);
lines.push(`  "syllabusUnit" = EXCLUDED."syllabusUnit",`);
lines.push(`  "questionMd" = EXCLUDED."questionMd",`);
lines.push(`  "manualMd" = EXCLUDED."manualMd",`);
lines.push(`  "hintsMd" = EXCLUDED."hintsMd",`);
lines.push(`  "starterCode" = EXCLUDED."starterCode",`);
lines.push(`  "datasetUrl" = EXCLUDED."datasetUrl",`);
lines.push(`  "datasetPreviewMd" = EXCLUDED."datasetPreviewMd",`);
lines.push(`  "autograderCode" = EXCLUDED."autograderCode",`);
lines.push(`  "maxScore" = EXCLUDED."maxScore",`);
lines.push(`  "estMinutes" = EXCLUDED."estMinutes";`);

const sql = lines.join("\n");
const outPath = path.join(
  "C:\\Users\\Aarya\\AppData\\Local\\Temp\\claude\\D--MLearn-Platform\\39c62f54-0054-4752-a055-d5761f825052\\scratchpad",
  "experiments.sql"
);
fs.writeFileSync(outPath, sql);
console.log(`generated SQL -> ${outPath} (${sql.length} chars, ${experiments.length} experiments)`);

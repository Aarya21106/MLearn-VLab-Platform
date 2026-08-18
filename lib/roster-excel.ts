import "server-only";
import * as XLSX from "xlsx";

const TEMPLATE_HEADERS = ["Registration Number", "Name", "Section"] as const;
const CREDENTIALS_HEADERS = ["Registration Number", "Name", "Section", "Password"] as const;

export type RosterRow = {
  registerNumber: string;
  name: string;
  section: string;
};

export type RosterRowError = {
  row: number; // 1-based, matches the spreadsheet row number (header = row 1)
  message: string;
};

export type CredentialsRow = RosterRow & {
  password: string | null; // null for existing students whose password wasn't touched
};

export function buildTemplateWorkbook(): Buffer {
  const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS as unknown as string[]]);
  sheet["!cols"] = [{ wch: 20 }, { wch: 28 }, { wch: 12 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Roster");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function normalizeHeader(header: unknown): string {
  return String(header ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

export function parseRosterWorkbook(buffer: Buffer): {
  rows: RosterRow[];
  errors: RosterRowError[];
} {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (raw.length === 0) {
    return { rows: [], errors: [{ row: 1, message: "Sheet is empty." }] };
  }

  const headerRow = raw[0].map(normalizeHeader);
  const regNoIdx = headerRow.findIndex((h) => h === "registrationnumber" || h === "regno" || h === "registernumber");
  const nameIdx = headerRow.findIndex((h) => h === "name");
  const sectionIdx = headerRow.findIndex((h) => h === "section");

  if (regNoIdx === -1 || nameIdx === -1 || sectionIdx === -1) {
    return {
      rows: [],
      errors: [
        {
          row: 1,
          message: "Expected columns: Registration Number, Name, Section.",
        },
      ],
    };
  }

  const rows: RosterRow[] = [];
  const errors: RosterRowError[] = [];
  const seenRegNos = new Set<string>();

  for (let i = 1; i < raw.length; i++) {
    const line = raw[i];
    const rowNumber = i + 1;
    const registerNumber = String(line[regNoIdx] ?? "").trim();
    const name = String(line[nameIdx] ?? "").trim();
    const section = String(line[sectionIdx] ?? "").trim();

    if (!registerNumber && !name && !section) continue; // blank trailing row

    if (!registerNumber) {
      errors.push({ row: rowNumber, message: "Missing registration number." });
      continue;
    }
    if (!name) {
      errors.push({ row: rowNumber, message: "Missing name." });
      continue;
    }
    if (seenRegNos.has(registerNumber)) {
      errors.push({ row: rowNumber, message: `Duplicate registration number "${registerNumber}" in this file.` });
      continue;
    }

    seenRegNos.add(registerNumber);
    rows.push({ registerNumber, name, section });
  }

  return { rows, errors };
}

export function buildCredentialsWorkbook(rows: CredentialsRow[]): Buffer {
  const aoa: (string | number)[][] = [
    CREDENTIALS_HEADERS as unknown as string[],
    ...rows.map((r) => [
      r.registerNumber,
      r.name,
      r.section,
      r.password ?? "(unchanged - use Reset password to issue a new one)",
    ]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = [{ wch: 20 }, { wch: 28 }, { wch: 12 }, { wch: 34 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Credentials");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

import { requireAdmin } from "@/lib/auth-helpers";
import { buildTemplateWorkbook } from "@/lib/roster-excel";

export async function GET() {
  await requireAdmin();

  const buffer = buildTemplateWorkbook();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="mlearn-roster-template.xlsx"`,
    },
  });
}

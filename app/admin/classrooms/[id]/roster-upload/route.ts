import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parseRosterWorkbook, buildCredentialsWorkbook } from "@/lib/roster-excel";
import { applyRosterUpload } from "@/lib/classrooms";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const classroom = await prisma.classroom.findUnique({ where: { id } });
  if (!classroom) {
    return NextResponse.json({ message: "Classroom not found." }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No file uploaded." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, errors } = parseRosterWorkbook(buffer);

  if (errors.length > 0) {
    return NextResponse.json({ message: "Fix the highlighted rows and re-upload.", errors }, { status: 400 });
  }
  if (rows.length === 0) {
    return NextResponse.json({ message: "No student rows found in the sheet." }, { status: 400 });
  }

  const credentialsRows = await applyRosterUpload(id, rows);
  const outputBuffer = buildCredentialsWorkbook(credentialsRows);

  return new Response(new Uint8Array(outputBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="mlearn-credentials-${classroom.name.replace(/[^a-z0-9]+/gi, "-")}.xlsx"`,
    },
  });
}

"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_LENGTH = 40;

export async function updateDisplayName(displayName: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");

  const trimmed = displayName.trim().slice(0, MAX_LENGTH);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName: trimmed || null },
  });
}

import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Re-verifies the session role against the DB (not just the JWT claim) so a
 * role downgrade takes effect immediately instead of waiting for re-login.
 * Use in every admin server action / API route that returns student data.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, email: true, name: true, displayName: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") throw new Error("FORBIDDEN");

  return dbUser;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, email: true, name: true, displayName: true },
  });

  if (!dbUser) throw new Error("UNAUTHENTICATED");

  return dbUser;
}

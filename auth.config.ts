import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe slice of the auth config, used by middleware.ts. Must not pull
 * in Node-only deps (bcryptjs, Prisma adapter, DB calls) - middleware runs
 * in the Edge runtime with a strict bundle size limit. The full config with
 * providers and the adapter lives in auth.ts (Node.js runtime only).
 */
export const authConfig = {
  pages: {
    signIn: "/",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "STUDENT" | "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

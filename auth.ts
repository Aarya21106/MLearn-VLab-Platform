import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const DUMMY_ADMIN_AUTH_ENABLED = process.env.ENABLE_DUMMY_ADMIN_AUTH === "true";

const providers: Provider[] = [
  Google({
    clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    authorization: {
      params: {
        prompt: "select_account",
      },
    },
    // The two dummy admin accounts are seeded directly (for the credentials
    // login) without ever going through Google OAuth, so they have no linked
    // Account row. Without this, signing in with Google using that same
    // email hits OAuthAccountNotLinked instead of attaching to the existing
    // user. SRM hasn't issued @srmist.edu.in Google Workspace access to
    // students (they all sign in with personal email), so the only rows
    // this can ever silently link to are those two known admin accounts.
    allowDangerousEmailAccountLinking: true,
  }),
];

if (DUMMY_ADMIN_AUTH_ENABLED) {
  providers.push(
    Credentials({
      id: "credentials",
      name: "Admin sign-in",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash || user.role !== "ADMIN") {
          // Generic failure - never reveal which check failed.
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "STUDENT" | "ADMIN";
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) return;

      try {
        const isAllowlistedAdmin =
          user.email === process.env.ADMIN_EMAIL_1 ||
          user.email === process.env.ADMIN_EMAIL_2;

        const dbUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            ...(isAllowlistedAdmin ? { role: "ADMIN" as const } : {}),
          },
        });

        await prisma.activityEvent.create({
          data: {
            userId: dbUser.id,
            type: "login",
          },
        });
      } catch (err) {
        console.error("Failed to record signIn event or update lastLoginAt:", err);
      }
    },
    async signOut(message) {
      try {
        let userId: string | undefined;
        if ("token" in message && message.token && typeof message.token.id === "string") {
          userId = message.token.id;
        } else if (
          "session" in message &&
          message.session &&
          typeof message.session === "object" &&
          "user" in message.session &&
          (message.session.user as { id?: string })?.id
        ) {
          userId = (message.session.user as { id?: string }).id;
        }
        if (userId) {
          await prisma.activityEvent.create({
            data: {
              userId,
              type: "logout",
            },
          });
        }
      } catch (err) {
        console.error("Failed to record signOut event:", err);
      }
    },
  },
});

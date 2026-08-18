import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const providers: Provider[] = [
  Credentials({
    id: "admin",
    name: "Faculty / Admin sign-in",
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
  }),
  Credentials({
    id: "student",
    name: "Student sign-in",
    credentials: {
      registerNumber: { label: "Registration number", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const registerNumber = credentials?.registerNumber as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!registerNumber || !password) return null;

      const user = await prisma.user.findUnique({ where: { registerNumber } });
      if (!user || !user.passwordHash || user.role !== "STUDENT") {
        // Generic failure - never reveal which check failed.
        return null;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        name: user.name,
        role: user.role,
      };
    },
  }),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
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
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await prisma.activityEvent.create({
          data: {
            userId: user.id,
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

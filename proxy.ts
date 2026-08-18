import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Next.js 16 renamed Middleware to Proxy (same runtime, same matcher API);
// see node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isLabRoute = pathname.startsWith("/lab");
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isLabRoute && !isAdminRoute) return NextResponse.next();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Role is only ever trusted here for the redirect decision, not for data
  // access - every server action / API route re-verifies role itself.
  if (isAdminRoute && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/lab", req.url));
  }

  if (isLabRoute && session.user.role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/lab/:path*", "/admin/:path*"],
};

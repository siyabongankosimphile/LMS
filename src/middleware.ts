import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Redirect unauthenticated users
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string;
    const status = token.status as string;

    // Facilitators that are pending/rejected cannot access facilitator routes
    if (
      pathname.startsWith("/facilitator") &&
      role === "FACILITATOR" &&
      status !== "ACTIVE"
    ) {
      return NextResponse.redirect(
        new URL("/dashboard?error=pending_approval", req.url)
      );
    }

    // Admin routes
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Facilitator routes
    if (
      pathname.startsWith("/facilitator") &&
      role !== "FACILITATOR" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/courses/:path*",
    "/admin/:path*",
    "/facilitator/:path*",
  ],
};

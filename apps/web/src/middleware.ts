import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/email-sent",
  "/forgot-password",
  "/reset-password",
  "/verify-required",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all API routes - middleware should not block API routes
  // Auth is handled by Better Auth API directly
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow static files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (with or without __Secure- prefix)
  const sessionCookie = 
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session_token");

  // If no session, redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For production with email verification required, check if user is verified
  if (process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === "true") {
    // The verification status check should be done server-side
    // For now, we just check if the session cookie exists
    // Better Auth handles the actual verification status in the API routes
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

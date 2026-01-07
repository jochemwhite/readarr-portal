import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

const publicPaths = ["/login"];
const publicApiPaths = ["/api/auth/login", "/api/auth/logout", "/api/health"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public pages
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow public API endpoints
  if (publicApiPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check session
  const token = request.cookies.get("session")?.value;

  if (!token) {
    // For API routes, return 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // For pages, redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const user = await verifySession(token);

  if (!user) {
    // For API routes, return 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // For pages, redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * Note: API routes ARE matched now for authentication
     */
    "/((?!_next/static|_next/image|favicon.ico|placeholder-book.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

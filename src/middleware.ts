import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/select-business"];
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // 1. Redirect to login if accessing a protected route without a session cookie
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    // Remember redirect destination
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect to dashboard if logged in and trying to access login/register
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Configure routes to run middleware on
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/select-business/:path*",
    "/login",
    "/register",
  ],
};

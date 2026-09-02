import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic redirect only, based on cookie presence — NOT an authorization
 * check. Every real authorization decision happens server-side, at the data
 * boundary (see lib/auth/session.ts), because Proxy cannot safely verify a
 * session (no DB access, no revocation check) and must stay fast.
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(getSessionCookie(request));
  const { pathname } = request.nextUrl;

  if (!hasSessionCookie && pathname.startsWith("/app")) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (hasSessionCookie && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup"],
};

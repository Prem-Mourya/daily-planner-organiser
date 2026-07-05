import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken, authSecret } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const secret = authSecret();
  if (!secret) return NextResponse.next(); // auth disabled (no APP_PASSWORD)

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login")) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value ?? "";
  if (await verifySessionToken(token, secret)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  // Run on every route except Next internals and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

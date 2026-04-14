import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/app/lib/admin-session";

function isProtectedAdminPath(pathname: string) {
  if (pathname === "/admin") return true;
  if (pathname.startsWith("/admin/")) return pathname !== "/admin/login";

  if (pathname.startsWith("/api/admin/")) {
    return pathname !== "/api/admin/login";
  }

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isProtectedAdminPath(pathname)) {
    return NextResponse.next();
  }

  const session = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const hasSession = Boolean(session);

  if (hasSession) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin/")) {
    return NextResponse.json(
      { ok: false, error: "No autorizado." },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/admin/login", req.url);
  loginUrl.searchParams.set("from", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
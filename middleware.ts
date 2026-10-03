import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") return NextResponse.next();

  const expected = process.env.ADMIN_ACCESS_TOKEN;
  const supplied = request.cookies.get("oksa_admin_access")?.value;

  if (expected && supplied === expected) {
    if (pathname.startsWith("/api/admin")) {
      const headers = new Headers(request.headers);
      headers.set("x-oksa-admin-auth", "1");
      return NextResponse.next({ request: { headers } });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };

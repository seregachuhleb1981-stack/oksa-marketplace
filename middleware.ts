import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const expected = process.env.ADMIN_ACCESS_TOKEN;
  const supplied = request.cookies.get("oksa_admin_access")?.value;
  if (expected && supplied === expected) return NextResponse.next();

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = { matcher: ["/admin/:path*"] };

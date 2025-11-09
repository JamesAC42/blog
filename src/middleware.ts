import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthCookieName, verifyAdminJwt } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiAdmin = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin");
  const isAuthApi = pathname.startsWith("/api/admin/auth");

  if (!isApiAdmin && !isAdminPage) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getAuthCookieName())?.value;
  const payload = token ? await verifyAdminJwt(token) : null;
  const isAuthed = !!payload;

  if (isApiAdmin) {
    // Allow auth endpoints without a session
    if (isAuthApi) {
      return NextResponse.next();
    }
    if (!isAuthed) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return NextResponse.next();
  }

  // Admin pages
  if (isAdminPage && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*", "/admin/:path*"],
};



import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// First-line gate for the admin backend. Real authorization checks are also
// performed in the admin layout and every admin server route / action.
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isLogin = pathname === "/admin/login";

  if (!isAdminArea || isLogin) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session?.user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

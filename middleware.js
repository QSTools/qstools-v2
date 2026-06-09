import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/demo-login",
  "/api/demo-login",
  "/favicon.ico",
];

function is_public_path(pathname) {
  return (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets")
  );
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (is_public_path(pathname)) {
    return NextResponse.next();
  }

  const demo_password = process.env.DEMO_PASSWORD;

  // If no password is set in Vercel, do not lock yourself out locally.
  if (!demo_password) {
    return NextResponse.next();
  }

  const access_cookie = request.cookies.get("qs_tools_demo_access")?.value;

  if (access_cookie === demo_password) {
    return NextResponse.next();
  }

  const login_url = request.nextUrl.clone();
  login_url.pathname = "/demo-login";
  login_url.searchParams.set("next", pathname);

  return NextResponse.redirect(login_url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
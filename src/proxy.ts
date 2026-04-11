import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) return NextResponse.next();

  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // ADMIN trying to access client routes — redirect to admin
    if (pathname.startsWith("/dashboard") && role !== "CLIENT") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // CLIENT trying to access admin routes — redirect to dashboard
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // CLIENT trying to access admin API
    if (pathname.startsWith("/api/admin") && role !== "ADMIN") {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sitzung abgelaufen" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("access_token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

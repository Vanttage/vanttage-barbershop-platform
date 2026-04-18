import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "vanttage.app";
const RESERVED_SLUGS = new Set(["www", "app", "admin", "api", "static", "cdn"]);
const BOOKING_PATH = "/reservar";

const ADMIN_PATHS = [
  "/dashboard",
  "/superadmin",
];

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

// Matches /{slug}/reservar where slug is a valid kebab-case identifier
const PATH_SLUG_RE = /^\/([a-z0-9][a-z0-9-]*[a-z0-9])\/reservar(\/|$)/;

function resolveTenantSlug(host: string, pathname: string): string | null {
  // 1. Subdomain routing (production: barberia-kurvo.vanttage.app)
  if (host.endsWith(`.${BASE_DOMAIN}`)) {
    const candidate = host.replace(`.${BASE_DOMAIN}`, "");
    return RESERVED_SLUGS.has(candidate) ? null : candidate;
  }

  // 2. Path-based routing: /{slug}/reservar (dev and production)
  const pathMatch = PATH_SLUG_RE.exec(pathname);
  if (pathMatch && !RESERVED_SLUGS.has(pathMatch[1])) {
    return pathMatch[1];
  }

  // 3. Dev env fallback for subdomain-less requests
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return process.env.VANTTAGE_DEV_TENANT ?? null;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host") ?? "";
  let tenantSlug = resolveTenantSlug(host, pathname);

  // Cookie fallback: API calls from path-based booking pages send the cookie
  // set during the page request, so we can resolve the tenant for /api/* routes.
  if (!tenantSlug && pathname.startsWith("/api/")) {
    const cookieSlug = request.cookies.get("tenant-slug")?.value;
    if (cookieSlug && !RESERVED_SLUGS.has(cookieSlug)) {
      tenantSlug = cookieSlug;
    }
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Dashboard / API routes accessed from app.vanttagetech.com have no subdomain
  // tenant. Fall back to the tenantSlug stored in the JWT so that getTenantContext()
  // can resolve the barbershop for the logged-in owner.
  if (!tenantSlug && token?.tenantSlug) {
    tenantSlug = token.tenantSlug;
  }

  const headers = new Headers(request.headers);

  if (tenantSlug) {
    headers.set("x-tenant-slug", tenantSlug);
  }

  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

  if (tenantSlug && pathname === "/") {
    return NextResponse.redirect(new URL(BOOKING_PATH, request.url));
  }

  // ── /superadmin → solo role superadmin ─────────────────────────────────
  if (pathname.startsWith("/superadmin")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (token.role !== "superadmin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // ── /dashboard → solo role owner ───────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (token.role === "superadmin") {
      return NextResponse.redirect(new URL("/superadmin", request.url));
    }
    if (token.role !== "owner") {
      return NextResponse.redirect(
        new URL(tenantSlug ? BOOKING_PATH : "/", request.url),
      );
    }
  }

  const isBookingPath = pathname === "/reservar" || pathname.includes("/reservar");
  if (!isBookingPath && tenantSlug && token?.tenantSlug && token.tenantSlug !== tenantSlug) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPath && token) {
    const roleDestinations: Record<string, string> = {
      superadmin: "/superadmin",
      owner: "/dashboard",
      client: tenantSlug ? BOOKING_PATH : "/",
    };
    const destination = roleDestinations[token.role] ?? "/";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const response = NextResponse.next({ request: { headers } });

  if (tenantSlug) {
    response.cookies.set("tenant-slug", tenantSlug, {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|images|fonts).*)",
    "/api/:path*",
  ],
};

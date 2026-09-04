import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { GOOGLE_PENDING_PREFIX } from "@/src/lib/googleAuth";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "vanttage.app";
const RESERVED_SLUGS = new Set(["www", "app", "admin", "api", "static", "cdn"]);
const BOOKING_PATH = "/reservar";
// Segundo paso de "Continuar con Google" en /register — completa el
// registro (nombre de barbería + teléfono) sin pedir contraseña. Requiere
// una sesión "pendiente" (ver src/lib/auth.ts), no una cuenta ya creada.
const GOOGLE_COMPLETE_PATH = "/register/completar";

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
  // can resolve the barbershop for the logged-in owner. This must win over the
  // localhost dev-tenant fallback below — otherwise every logged-in user on
  // localhost gets routed to VANTTAGE_DEV_TENANT instead of their own tenant.
  if (!tenantSlug && token?.tenantSlug) {
    tenantSlug = token.tenantSlug;
  }

  // Dev env fallback: only for anonymous/subdomain-less requests on localhost
  // (e.g. testing the public booking page without a subdomain). Never overrides
  // a real logged-in user's tenant, resolved above.
  if (
    !tenantSlug &&
    (host.includes("localhost") || host.includes("127.0.0.1"))
  ) {
    tenantSlug = process.env.VANTTAGE_DEV_TENANT ?? null;
  }

  const headers = new Headers(request.headers);

  if (tenantSlug) {
    headers.set("x-tenant-slug", tenantSlug);
  }

  const isPendingGoogleSignup =
    typeof token?.id === "string" && token.id.startsWith(GOOGLE_PENDING_PREFIX);
  // /register/completar vive bajo /register — no debe tratarse como "ya
  // tienes sesión, sal de la pantalla de auth" (ver bloque isAuthPath abajo).
  const isAuthPath =
    pathname !== GOOGLE_COMPLETE_PATH &&
    AUTH_PATHS.some((path) => pathname.startsWith(path));

  if (tenantSlug && pathname === "/") {
    return NextResponse.redirect(new URL(BOOKING_PATH, request.url));
  }

  // ── /register/completar → solo con sesión "pendiente" de Google ────────
  if (pathname === GOOGLE_COMPLETE_PATH) {
    if (!token) {
      return NextResponse.redirect(new URL("/register", request.url));
    }
    if (!isPendingGoogleSignup) {
      // Ya tiene cuenta (o nunca pasó por Google) — no debe volver aquí.
      const dest =
        token.role === "superadmin"
          ? "/superadmin"
          : token.role === "owner"
            ? "/dashboard"
            : tenantSlug
              ? BOOKING_PATH
              : "/";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    // Sesión pendiente real → dejar pasar sin más chequeos de rol/tenant.
    return NextResponse.next({ request: { headers } });
  }

  // ── /superadmin → solo role superadmin ─────────────────────────────────
  if (pathname.startsWith("/superadmin")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (isPendingGoogleSignup) {
      return NextResponse.redirect(new URL(GOOGLE_COMPLETE_PATH, request.url));
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
    if (isPendingGoogleSignup) {
      return NextResponse.redirect(new URL(GOOGLE_COMPLETE_PATH, request.url));
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
    if (isPendingGoogleSignup) {
      return NextResponse.redirect(new URL(GOOGLE_COMPLETE_PATH, request.url));
    }
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
      secure: process.env.NODE_ENV === "production",
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

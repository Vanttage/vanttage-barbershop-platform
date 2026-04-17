/**
 * Rate limiting helper.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * are configured (production). Falls back to an in-process Map for local dev
 * so there are zero external dependencies in development.
 *
 * Usage:
 *   const result = await rateLimit(request, { limit: 5, windowMs: 15 * 60_000 });
 *   if (!result.ok) return rateLimitResponse(result);
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix ms
}

// ── In-process fallback (dev only) ───────────────────────────────────────────

interface Entry { count: number; reset: number }
const inProcessStore = new Map<string, Entry>();

function inProcessLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  let entry = inProcessStore.get(key);
  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + windowMs };
    inProcessStore.set(key, entry);
  }
  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return { ok: entry.count <= limit, limit, remaining, reset: entry.reset };
}

// ── Upstash Redis (production) ────────────────────────────────────────────────

async function upstashLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${Math.round(windowMs / 1000)} s`),
    prefix: "vt_rl",
  });

  const { success, limit: lim, remaining, reset } = await rl.limit(key);
  return { ok: success, limit: lim, remaining, reset };
}

// ── Public API ────────────────────────────────────────────────────────────────

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function rateLimit(
  request: NextRequest,
  opts: { limit: number; windowMs: number; prefix?: string },
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const prefix = opts.prefix ?? request.nextUrl.pathname;
  const key = `${prefix}:${ip}`;

  const useUpstash =
    Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

  try {
    return useUpstash
      ? await upstashLimit(key, opts.limit, opts.windowMs)
      : inProcessLimit(key, opts.limit, opts.windowMs);
  } catch {
    // Never block a request due to rate-limit infrastructure failure
    return { ok: true, limit: opts.limit, remaining: opts.limit, reset: Date.now() + opts.windowMs };
  }
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
        "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
      },
    },
  );
}

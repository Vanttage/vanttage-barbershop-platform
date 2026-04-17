// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · app/api/dashboard/route.ts
//
//  Estadísticas del dashboard con cache en proceso (30 s TTL).
//  El cache se invalida automáticamente cada vez que una cita se crea,
//  actualiza o cancela (ver app/api/appointments/[id]/route.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getDashboardStats } from "@/src/services/appointments.service";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { getCached, setCached } from "@/src/lib/apiCache";
import type { DashboardStats } from "@/src/types";

const CACHE_TTL_MS = 30_000; // 30 segundos

export async function GET() {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  // ── Hit de cache ───────────────────────────────────────────────────────────
  const cacheKey = `dashboard:${ctx.barbershopId}`;
  const cached = getCached<DashboardStats>(cacheKey);
  if (cached) {
    const res = NextResponse.json({ data: cached, cached: true });
    res.headers.set("Cache-Control", "private, no-cache");
    return res;
  }

  // ── Miss de cache → calcular stats ────────────────────────────────────────
  try {
    const stats = await getDashboardStats({
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
    });

    setCached(cacheKey, stats, CACHE_TTL_MS);

    const res = NextResponse.json({ data: stats, cached: false });
    res.headers.set("Cache-Control", "private, no-cache");
    return res;
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

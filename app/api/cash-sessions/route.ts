import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { OpenCashSessionSchema, validateBody } from "@/src/validations";
import { computeCashSummary } from "@/src/services/cash.service";

/** Historial de jornadas de caja (abiertas y cerradas), más recientes primero. */
export async function GET(request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 20)));

  const [sessions, total] = await Promise.all([
    prisma.cashSession.findMany({
      where: { tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
      orderBy: { openedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.cashSession.count({
      where: { tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
    }),
  ]);

  // Para cajas cerradas, el resumen guardado (expectedCash/difference) ya es
  // definitivo — no se recalcula. Para una que apareciera abierta en el
  // historial, se computa en vivo igual que en /current.
  const data = await Promise.all(
    sessions.map(async (session) => {
      if (session.status === "closed") {
        return { ...session, summary: null };
      }
      const summary = await computeCashSummary(ctx.tenantId, ctx.barbershopId, session);
      return { ...session, summary };
    }),
  );

  return NextResponse.json({
    data,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

/** Abre una nueva jornada de caja. Solo puede haber una abierta a la vez. */
export async function POST(request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const alreadyOpen = await prisma.cashSession.findFirst({
    where: { tenantId: ctx.tenantId, barbershopId: ctx.barbershopId, status: "open" },
  });
  if (alreadyOpen) {
    return NextResponse.json(
      { error: "Ya hay una caja abierta. Ciérrala antes de abrir otra." },
      { status: 409 },
    );
  }

  const body = await request.json();
  const parsed = validateBody(OpenCashSessionSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const session = await prisma.cashSession.create({
    data: {
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
      openingAmount: parsed.data.openingAmount,
      openedByUserId: auth.user.id,
    },
  });

  return NextResponse.json({ data: session }, { status: 201 });
}

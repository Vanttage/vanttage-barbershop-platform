import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { computeCashSummary } from "@/src/services/cash.service";

type Params = { params: Promise<{ id: string }> };

/** Detalle de una jornada (abierta o cerrada) con sus movimientos y pagos. */
export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const { id } = await params;
  const session = await prisma.cashSession.findFirst({
    where: { id, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
    include: {
      openedBy: { select: { id: true, name: true } },
      closedBy: { select: { id: true, name: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Jornada de caja no encontrada" }, { status: 404 });
  }

  const windowEnd = session.closedAt ?? new Date();

  const [summary, payments, movements] = await Promise.all([
    computeCashSummary(ctx.tenantId, ctx.barbershopId, session),
    prisma.payment.findMany({
      where: {
        tenantId: ctx.tenantId,
        barbershopId: ctx.barbershopId,
        status: "paid",
        paidAt: { gte: session.openedAt, lte: windowEnd },
      },
      orderBy: { paidAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        appointment: { select: { id: true, service: { select: { name: true } } } },
      },
    }),
    prisma.cashMovement.findMany({
      where: { cashSessionId: session.id },
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, name: true } } },
    }),
  ]);

  return NextResponse.json({ data: { session, summary, payments, movements } });
}

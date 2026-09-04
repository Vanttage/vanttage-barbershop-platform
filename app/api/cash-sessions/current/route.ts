import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { computeCashSummary } from "@/src/services/cash.service";

/**
 * La jornada de caja abierta ahora mismo, con su resumen en vivo y los
 * movimientos para pintar el feed cronológico. Si no hay caja abierta,
 * `data` es null — la UI debe mostrar el estado "Abrir caja".
 */
export async function GET(_request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const session = await prisma.cashSession.findFirst({
    where: { tenantId: ctx.tenantId, barbershopId: ctx.barbershopId, status: "open" },
    include: {
      openedBy: { select: { id: true, name: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ data: null });
  }

  const [summary, payments, movements] = await Promise.all([
    computeCashSummary(ctx.tenantId, ctx.barbershopId, session),
    prisma.payment.findMany({
      where: {
        tenantId: ctx.tenantId,
        barbershopId: ctx.barbershopId,
        status: "paid",
        paidAt: { gte: session.openedAt },
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

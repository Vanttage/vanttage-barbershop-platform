import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { CloseCashSessionSchema, validateBody } from "@/src/validations";
import { computeCashSummary } from "@/src/services/cash.service";

type Params = { params: Promise<{ id: string }> };

/**
 * Cierra la jornada: congela el efectivo esperado (calculado en el
 * servidor, nunca confiando en lo que mande el cliente) contra el efectivo
 * contado físicamente, y guarda la diferencia. Una vez cerrada, sus
 * movimientos quedan inmutables — no hay PATCH para "reabrir" ni editar.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
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
  });

  if (!session) {
    return NextResponse.json({ error: "Jornada de caja no encontrada" }, { status: 404 });
  }

  if (session.status === "closed") {
    return NextResponse.json({ error: "Esta caja ya está cerrada" }, { status: 409 });
  }

  const body = await request.json();
  const parsed = validateBody(CloseCashSessionSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const closedAt = new Date();
  const summary = await computeCashSummary(ctx.tenantId, ctx.barbershopId, {
    ...session,
    closedAt,
  });
  const difference = parsed.data.countedCash - summary.expectedCash;

  const updated = await prisma.cashSession.update({
    where: { id },
    data: {
      status: "closed",
      closedAt,
      closedByUserId: auth.user.id,
      expectedCash: summary.expectedCash,
      countedCash: parsed.data.countedCash,
      difference,
      closeNote: parsed.data.note || null,
    },
  });

  return NextResponse.json({ data: { session: updated, summary } });
}

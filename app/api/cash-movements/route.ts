import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { CreateCashMovementSchema, validateBody } from "@/src/validations";

/**
 * Registra un gasto o ajuste. Siempre contra la caja abierta ahora mismo
 * (se resuelve en el servidor, nunca se recibe un cashSessionId del
 * cliente) — así una caja cerrada queda imposible de tocar sin necesidad
 * de un chequeo aparte, y no hay forma de registrar un movimiento contra
 * una jornada equivocada.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const openSession = await prisma.cashSession.findFirst({
    where: { tenantId: ctx.tenantId, barbershopId: ctx.barbershopId, status: "open" },
  });
  if (!openSession) {
    return NextResponse.json(
      { error: "No tienes una caja abierta. Abre la caja antes de registrar movimientos." },
      { status: 409 },
    );
  }

  const body = await request.json();
  const parsed = validateBody(CreateCashMovementSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Un gasto siempre sale de caja, sin importar qué "direction" haya
  // mandado el cliente — solo los ajustes pueden ir en cualquier sentido.
  const direction = parsed.data.type === "expense" ? "out" : parsed.data.direction;
  const signedAmount = direction === "out" ? -parsed.data.amount : parsed.data.amount;

  const movement = await prisma.cashMovement.create({
    data: {
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
      cashSessionId: openSession.id,
      type: parsed.data.type,
      amount: signedAmount,
      method: parsed.data.method,
      concept: parsed.data.concept,
      category: parsed.data.category || null,
      note: parsed.data.note || null,
      actorUserId: auth.user.id,
    },
    include: {
      actor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: movement }, { status: 201 });
}

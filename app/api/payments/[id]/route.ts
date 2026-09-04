import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { RegisterPaymentSchema, validateBody } from "@/src/validations";

type Params = { params: Promise<{ id: string }> };

/**
 * Cobra un pago pendiente: el dueño elige el método (efectivo, Nequi,
 * Daviplata, transferencia) y opcionalmente una referencia. Esto es lo
 * que dispara "Registrar pago" sobre un pendiente ya existente — no crea
 * un pago nuevo, marca el que nació al completar la cita.
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
  const payment = await prisma.payment.findFirst({
    where: { id, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
  });

  if (!payment) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  if (payment.status === "paid") {
    return NextResponse.json({ error: "Este pago ya fue registrado como pagado" }, { status: 409 });
  }

  const body = await request.json();
  const parsed = validateBody(RegisterPaymentSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      status: "paid",
      method: parsed.data.method,
      reference: parsed.data.reference || payment.reference,
      paidAt: new Date(),
    },
    include: {
      client: { select: { id: true, name: true, phone: true, email: true } },
      appointment: {
        select: {
          id: true,
          startsAt: true,
          status: true,
          total: true,
          service: { select: { id: true, name: true } },
          barber: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ data: updated });
}

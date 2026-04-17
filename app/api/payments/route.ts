import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { CreatePaymentSchema, validateBody } from "@/src/validations";

export async function GET(request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const method = request.nextUrl.searchParams.get("method") ?? undefined;

  const payments = await prisma.payment.findMany({
    where: {
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
      ...(status ? { status: status as "pending" | "paid" | "failed" | "refunded" } : {}),
      ...(method ? { method: method as "cash" | "transfer" | "card" | "nequi" | "daviplata" } : {}),
    },
    include: {
      client: {
        select: { id: true, name: true, phone: true, email: true },
      },
      appointment: {
        select: {
          id: true,
          startsAt: true,
          status: true,
          total: true,
          service: {
            select: { id: true, name: true },
          },
          barber: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ data: payments });
}

export async function POST(request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = validateBody(CreatePaymentSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: parsed.data.appointmentId,
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
    },
    include: {
      client: {
        select: { id: true },
      },
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const payment = await prisma.payment.create({
    data: {
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
      appointmentId: appointment.id,
      clientId: appointment.client.id,
      method: parsed.data.method,
      amount: parsed.data.amount,
      status: parsed.data.status,
      reference: parsed.data.reference || null,
      paidAt: parsed.data.status === "paid" ? new Date() : null,
    },
    include: {
      client: {
        select: { id: true, name: true, phone: true, email: true },
      },
      appointment: {
        select: {
          id: true,
          startsAt: true,
          status: true,
          total: true,
          service: {
            select: { id: true, name: true },
          },
          barber: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ data: payment }, { status: 201 });
}

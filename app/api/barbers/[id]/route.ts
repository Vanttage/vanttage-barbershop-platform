import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { UpdateBarberSchema, validateBody } from "@/src/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const { id } = await params;
  const barber = await prisma.barber.findFirst({
    where: { id, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
    include: {
      schedules: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { appointments: true, favorites: true } },
    },
  });

  if (!barber) {
    return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: barber });
}

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
  const existing = await prisma.barber.findFirst({
    where: { id, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = validateBody(UpdateBarberSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updated = await prisma.barber.update({
    where: { id },
    data: parsed.data,
    include: {
      schedules: { orderBy: { dayOfWeek: "asc" } },
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const { id } = await params;
  const existing = await prisma.barber.findFirst({
    where: { id, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
  }

  const hasActiveAppointments = await prisma.appointment.count({
    where: {
      barberId: id,
      status: { in: ["pending", "confirmed", "in_progress"] },
    },
  });

  if (hasActiveAppointments > 0) {
    return NextResponse.json(
      { error: "El barbero tiene citas activas. Cancelalas antes de eliminar." },
      { status: 409 },
    );
  }

  await prisma.barber.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}

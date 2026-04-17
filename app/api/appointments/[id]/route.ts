import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { UpdateAppointmentSchema, validateBody } from "@/src/validations";
import { invalidateByPrefix } from "@/src/lib/apiCache";

type Params = { params: Promise<{ id: string }> };

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
  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
    },
    include: {
      barber: true,
      client: true,
      service: { include: { category: true } },
      payments: true,
      history: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ data: appointment });
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
  const body = await request.json();
  const parsed = validateBody(UpdateAppointmentSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
    },
    include: { service: true },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.appointment.update({
      where: { id },
      data: {
        ...parsed.data,
        completedAt:
          parsed.data.status === "completed" ? new Date() : appointment.completedAt,
      },
      include: {
        barber: true,
        client: true,
        service: true,
      },
    });

    if (parsed.data.status) {
      await tx.appointmentHistory.create({
        data: {
          tenantId: ctx.tenantId,
          appointmentId: appointment.id,
          status: parsed.data.status,
          observations: parsed.data.notes ?? parsed.data.cancelReason ?? null,
          servicePerformed: appointment.service.name,
          actorUserId: auth.user.id,
        },
      });
    }

    return result;
  });

  // Invalidar cache del dashboard para que refleje el cambio de estado
  invalidateByPrefix(`dashboard:${ctx.barbershopId}`);

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
  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelReason: "Cancelada desde panel",
      },
    });

    await tx.appointmentHistory.create({
      data: {
        tenantId: ctx.tenantId,
        appointmentId: id,
        status: "cancelled",
        observations: "Cancelada desde panel",
        actorUserId: auth.user.id,
      },
    });

    return updated;
  });

  // Invalidar cache del dashboard
  invalidateByPrefix(`dashboard:${ctx.barbershopId}`);

  return NextResponse.json({ data: cancelled });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { createAppointment } from "@/src/services/appointments.service";
import { invalidateByPrefix } from "@/src/lib/apiCache";
import {
  AppointmentsQuerySchema,
  CreateAppointmentSchema,
  validateBody,
} from "@/src/validations";

export async function GET(request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const raw = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = validateBody(AppointmentsQuerySchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { date, dateFrom, dateTo, barberId, status, page, limit } = parsed.data;
  const where: Record<string, unknown> = {
    tenantId: ctx.tenantId,
    barbershopId: ctx.barbershopId,
  };

  if (dateFrom && dateTo) {
    where.startsAt = {
      gte: new Date(`${dateFrom}T00:00:00.000Z`),
      lte: new Date(`${dateTo}T23:59:59.999Z`),
    };
  } else if (date) {
    where.startsAt = {
      gte: new Date(`${date}T00:00:00.000Z`),
      lte: new Date(`${date}T23:59:59.999Z`),
    };
  }

  if (barberId) where.barberId = barberId;
  if (status) where.status = status;

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        // Solo campos usados en AppointmentsList / AppointmentCard
        barber:  { select: { id: true, name: true } },
        service: { select: { id: true, name: true, durationMin: true, price: true } },
        client:  { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { startsAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  return NextResponse.json({
    data: appointments,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = validateBody(CreateAppointmentSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const appointment = await createAppointment(ctx, parsed.data);
    // Invalidar stats del dashboard al crear una cita nueva
    invalidateByPrefix(`dashboard:${ctx.barbershopId}`);
    return NextResponse.json({ data: appointment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("Conflicto") || message.includes("ocupado")
      ? 409
      : message.includes("no encontrado")
        ? 404
        : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

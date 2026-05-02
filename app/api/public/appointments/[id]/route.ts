import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkSlotAvailability } from "@/src/services/appointments.service";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_CANCEL_STATUSES = ["pending", "confirmed"];
const ALLOWED_RESCHEDULE_STATUSES = ["pending", "confirmed"];

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: {
      barber:     { select: { id: true, name: true, specialty: true, photoUrl: true, rating: true } },
      service:    { select: { id: true, name: true, durationMin: true, price: true } },
      client:     { select: { id: true, name: true, phone: true } },
      barbershop: {
        select: {
          id: true, name: true, address: true, city: true,
          whatsapp: true, openingTime: true, closingTime: true,
        },
      },
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!appt) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const canCancel    = ALLOWED_CANCEL_STATUSES.includes(appt.status);
  const canReschedule = ALLOWED_RESCHEDULE_STATUSES.includes(appt.status);

  return NextResponse.json({
    data: {
      id: appt.id,
      status: appt.status,
      startsAt: appt.startsAt,
      endsAt: appt.endsAt,
      price: appt.price,
      total: appt.total,
      notes: appt.notes,
      cancelReason: appt.cancelReason,
      barber: appt.barber,
      service: appt.service,
      client: appt.client,
      barbershop: appt.barbershop,
      tenantSlug: appt.tenant.slug,
      tenantName: appt.tenant.name,
      canCancel,
      canReschedule,
    },
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const action = body.action as "cancel" | "reschedule";

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { service: { select: { durationMin: true } } },
  });

  if (!appt) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  if (action === "cancel") {
    if (!ALLOWED_CANCEL_STATUSES.includes(appt.status)) {
      return NextResponse.json(
        { error: "Esta cita no puede cancelarse" },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: {
          status: "cancelled",
          cancelReason: body.reason ?? "Cancelada por el cliente",
        },
      });
      await tx.appointmentHistory.create({
        data: {
          tenantId:      appt.tenantId,
          appointmentId: id,
          status:        "cancelled",
          observations:  body.reason ?? "Cancelada por el cliente",
        },
      });
    });

    return NextResponse.json({ data: { ok: true, action: "cancelled" } });
  }

  if (action === "reschedule") {
    if (!ALLOWED_RESCHEDULE_STATUSES.includes(appt.status)) {
      return NextResponse.json(
        { error: "Esta cita no puede reagendarse" },
        { status: 409 },
      );
    }

    const newStartsAt = new Date(body.startsAt);
    if (isNaN(newStartsAt.getTime())) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }

    const newEndsAt = new Date(
      newStartsAt.getTime() + appt.service.durationMin * 60_000,
    );

    // Check blocked date
    const coDate = new Date(newStartsAt.getTime() - 5 * 60 * 60_000);
    const dateStr = coDate.toISOString().slice(0, 10);
    const blocked = await prisma.barberBlockedDate.findFirst({
      where: { barberId: appt.barberId, tenantId: appt.tenantId, date: dateStr },
    });
    if (blocked) {
      return NextResponse.json(
        { error: blocked.reason ?? "Barbero no disponible ese día" },
        { status: 409 },
      );
    }

    const { available, conflict } = await checkSlotAvailability(
      appt.tenantId,
      appt.barbershopId,
      appt.barberId,
      newStartsAt,
      newEndsAt,
      id, // exclude this appointment from conflict check
    );

    if (!available) {
      return NextResponse.json({ error: conflict ?? "Horario ocupado" }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: { startsAt: newStartsAt, endsAt: newEndsAt, status: "confirmed" },
      });
      await tx.appointmentHistory.create({
        data: {
          tenantId:      appt.tenantId,
          appointmentId: id,
          status:        "confirmed",
          observations:  `Reagendada para ${newStartsAt.toISOString()}`,
        },
      });
    });

    return NextResponse.json({ data: { ok: true, action: "rescheduled", startsAt: newStartsAt } });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}

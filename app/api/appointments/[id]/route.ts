import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { UpdateAppointmentSchema, validateBody } from "@/src/validations";
import { invalidateByPrefix } from "@/src/lib/apiCache";
import { checkBarberSchedule, checkSlotAvailability } from "@/src/services/appointments.service";

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
    include: { service: true, client: { select: { id: true } } },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const { startsAt, barberId, serviceId, finalPrice, ...statusFields } = parsed.data;
  const isCompleting = statusFields.status === "completed";
  const wasAlreadyCompleted = appointment.status === "completed";

  // Reprogramar (mover hora/barbero) y "corregir al completar" (ajustar
  // servicio/precio de lo que realmente se hizo) son operaciones distintas
  // aunque ambas puedan tocar serviceId. Al completar, un cambio de
  // servicio NUNCA dispara revalidación de horario/doble-reserva — la cita
  // ya ocurrió, no se está moviendo.
  const isReschedule = !isCompleting && (startsAt !== undefined || barberId !== undefined || serviceId !== undefined);

  try {
    // ── Reprogramar: cambia hora, barbero y/o servicio ────────────────────
    // Requiere recalcular endsAt/precio y revalidar disponibilidad — mismo
    // riesgo de doble reserva que al crear, así que usa el mismo patrón
    // (chequeo dentro de una transacción Serializable).
    let scheduleFields: {
      startsAt: Date;
      endsAt: Date;
      barberId: string;
      serviceId: string;
      price: number;
      total: number;
    } | null = null;

    if (isReschedule) {
      const effectiveBarberId = barberId ?? appointment.barberId;
      const effectiveStarts = startsAt ? new Date(startsAt) : appointment.startsAt;

      let effectiveService = appointment.service;
      if (serviceId && serviceId !== appointment.serviceId) {
        const newService = await prisma.service.findFirst({
          where: { id: serviceId, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId, active: true },
        });
        if (!newService) {
          return NextResponse.json({ error: "Servicio no encontrado o inactivo" }, { status: 404 });
        }
        effectiveService = newService;
      }

      // Se revalida el barbero efectivo (haya cambiado o no el barberId):
      // si el barbero original fue desactivado después de crear la cita, no
      // se puede seguir reprogramando trabajo nuevo para él — la cita ya
      // existente se conserva tal cual, pero para moverla hay que reasignar
      // a un barbero activo.
      const effectiveBarber = await prisma.barber.findFirst({
        where: { id: effectiveBarberId, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId, active: true },
      });
      if (!effectiveBarber) {
        return NextResponse.json(
          { error: "Ese barbero está inactivo. Asigna la cita a otro barbero para reprogramarla." },
          { status: 409 },
        );
      }

      const effectiveEnds = new Date(effectiveStarts.getTime() + effectiveService.durationMin * 60_000);

      scheduleFields = {
        startsAt: effectiveStarts,
        endsAt: effectiveEnds,
        barberId: effectiveBarberId,
        serviceId: effectiveService.id,
        price: effectiveService.id === appointment.serviceId ? appointment.price : effectiveService.price,
        total: effectiveService.id === appointment.serviceId ? appointment.total : effectiveService.price,
      };
    }

    // ── Completar: confirmar o corregir qué se hizo realmente ─────────────
    // El cliente reservó Degradado ($12.000) pero el barbero terminó
    // haciendo Degradado + Barba ($20.000) — esto deja registrado lo que
    // realmente pasó, para que Caja cobre lo correcto. No mueve la cita.
    let completionFields: {
      serviceId: string;
      endsAt: Date;
      price: number;
      total: number;
    } | null = null;
    let serviceCorrected = false;

    if (isCompleting && (serviceId || finalPrice !== undefined)) {
      let effectiveService = appointment.service;
      if (serviceId && serviceId !== appointment.serviceId) {
        const newService = await prisma.service.findFirst({
          where: { id: serviceId, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId, active: true },
        });
        if (!newService) {
          return NextResponse.json({ error: "Servicio no encontrado o inactivo" }, { status: 404 });
        }
        effectiveService = newService;
        serviceCorrected = true;
      }

      const finalAmount = finalPrice ?? effectiveService.price;
      completionFields = {
        serviceId: effectiveService.id,
        endsAt: new Date(appointment.startsAt.getTime() + effectiveService.durationMin * 60_000),
        price: finalAmount,
        total: finalAmount,
      };
    }

    const updated = await prisma.$transaction(
      async (tx) => {
        if (scheduleFields) {
          const scheduleCheck = await checkBarberSchedule(
            ctx.tenantId,
            ctx.barbershopId,
            scheduleFields.barberId,
            scheduleFields.startsAt,
            scheduleFields.endsAt,
            tx,
          );
          if (!scheduleCheck.ok) {
            throw new Error(scheduleCheck.error);
          }

          const availability = await checkSlotAvailability(
            ctx.tenantId,
            ctx.barbershopId,
            scheduleFields.barberId,
            scheduleFields.startsAt,
            scheduleFields.endsAt,
            id,
            tx,
          );
          if (!availability.available) {
            throw new Error(availability.conflict ?? "Horario ocupado");
          }
        }

        const result = await tx.appointment.update({
          where: { id },
          data: {
            ...statusFields,
            ...scheduleFields,
            ...completionFields,
            completedAt:
              statusFields.status === "completed" ? new Date() : appointment.completedAt,
          },
          include: {
            barber: true,
            client: true,
            service: true,
          },
        });

        // totalVisits/lastVisitAt reflejan visitas reales, no reservas — se
        // incrementan justo aquí, en la transición real a "completed" (no
        // si ya estaba completed y solo se corrige algo más después).
        if (isCompleting && !wasAlreadyCompleted) {
          await tx.client.update({
            where: { id: appointment.client.id },
            data: {
              totalVisits: { increment: 1 },
              lastVisitAt: appointment.startsAt,
            },
          });

          // El pago pendiente nace aquí — de la atención completada, no de
          // la reserva. Sin método todavía: eso se define al cobrar (ver
          // PATCH /api/payments/[id]). Si por algo ya existiera un pago
          // para esta cita, no se duplica.
          const existingPayment = await tx.payment.findFirst({
            where: { appointmentId: result.id },
            select: { id: true },
          });

          if (!existingPayment) {
            await tx.payment.create({
              data: {
                tenantId: ctx.tenantId,
                barbershopId: ctx.barbershopId,
                appointmentId: result.id,
                clientId: appointment.client.id,
                amount: result.total,
                status: "pending",
              },
            });
          }
        }

        if (statusFields.status || isReschedule || completionFields) {
          const observations = isReschedule
            ? "Cita reprogramada" + (statusFields.notes ? ` — ${statusFields.notes}` : "")
            : completionFields
              ? (serviceCorrected
                  ? `Servicio corregido a "${result.service.name}" — ${result.total}`
                  : `Precio corregido a ${result.total}`) +
                (statusFields.notes ? ` — ${statusFields.notes}` : "")
              : (statusFields.notes ?? statusFields.cancelReason ?? null);

          await tx.appointmentHistory.create({
            data: {
              tenantId: ctx.tenantId,
              appointmentId: appointment.id,
              status: statusFields.status ?? appointment.status,
              observations,
              servicePerformed: result.service.name,
              actorUserId: auth.user.id,
            },
          });
        }

        return result;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // Invalidar cache del dashboard para que refleje el cambio
    invalidateByPrefix(`dashboard:${ctx.barbershopId}`);

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Alguien más reservó este horario justo ahora. Intenta de nuevo." },
        { status: 409 },
      );
    }

    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("Conflicto") || message.includes("ocupado") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
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

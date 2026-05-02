import { prisma } from "@/src/lib/prisma";
import {
  buildConfirmationMessage,
  buildNewBookingAdminMessage,
  normalizePhone,
  sendWhatsAppText,
  isTwilioConfigured,
} from "@/src/lib/whatsapp";
import type { CreateAppointmentDTO, DashboardStats } from "@/src/types";

// ── Colombia timezone (UTC-5, sin horario de verano) ─────────────────────────
const CO_OFFSET_MS = 5 * 60 * 60_000; // 5 h en ms

/** Inicio del día "hoy" en Colombia como timestamp UTC.
 *  Medianoche Bogotá = 05:00 UTC */
function colStartOfToday(now: Date): Date {
  const coNow = new Date(now.getTime() - CO_OFFSET_MS);
  const y = coNow.getUTCFullYear();
  const m = coNow.getUTCMonth();
  const d = coNow.getUTCDate();
  return new Date(Date.UTC(y, m, d, 5, 0, 0, 0));
}

type SchedulerContext = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  barbershopId: string;
  barbershopName: string;
};

export async function checkSlotAvailability(
  tenantId: string,
  barbershopId: string,
  barberId: string,
  starts: Date,
  ends: Date,
  excludeId?: string,
) {
  const conflict = await prisma.appointment.findFirst({
    where: {
      tenantId,
      barbershopId,
      barberId,
      status: { in: ["pending", "confirmed", "in_progress"] },
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        { startsAt: { lt: ends, gte: starts } },
        { endsAt: { gt: starts, lte: ends } },
        { startsAt: { lte: starts }, endsAt: { gte: ends } },
      ],
    },
    select: { id: true, client: { select: { name: true } } },
  });

  if (conflict) {
    return {
      available: false,
      conflict: `Conflicto con la cita de ${conflict.client.name}`,
    };
  }

  return { available: true };
}

function getWeekRange(baseDate = new Date()) {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

export async function createAppointment(
  context: SchedulerContext,
  dto: CreateAppointmentDTO,
) {
  // ── Cargar tenant, barbershop, service y barber en paralelo ──────────────
  // Solo se seleccionan los campos realmente necesarios para reducir payload
  const [tenant, barbershop, service, barber] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: context.tenantId },
      select: {
        id: true,
        name: true,
        address: true,
        phoneWa: true,
        autoConfirmacion: true,
      },
    }),
    prisma.barbershop.findFirst({
      where: {
        id: context.barbershopId,
        tenantId: context.tenantId,
        active: true,
      },
      select: { id: true, address: true, whatsapp: true, active: true },
    }),
    prisma.service.findFirst({
      where: {
        id: dto.serviceId,
        tenantId: context.tenantId,
        barbershopId: context.barbershopId,
        active: true,
      },
      select: { id: true, name: true, price: true, durationMin: true, active: true },
    }),
    prisma.barber.findFirst({
      where: {
        id: dto.barberId,
        tenantId: context.tenantId,
        barbershopId: context.barbershopId,
        active: true,
      },
      select: { id: true, name: true, active: true },
    }),
  ]);

  if (!tenant) throw new Error("Tenant no encontrado");
  if (!barbershop) throw new Error("Barberia no encontrada");
  if (!service) throw new Error("Servicio no encontrado o inactivo");
  if (!barber) throw new Error("Barbero no encontrado o inactivo");

  const starts = new Date(dto.startsAt);
  const ends = new Date(starts.getTime() + service.durationMin * 60_000);
  const dayOfWeek = starts.getDay();
  const hourMinute = `${String(starts.getHours()).padStart(2, "0")}:${String(
    starts.getMinutes(),
  ).padStart(2, "0")}`;

  // Fecha como YYYY-MM-DD en hora Colombia
  const coDate = new Date(starts.getTime() - CO_OFFSET_MS);
  const dateStr = coDate.toISOString().slice(0, 10);

  const [schedule, blockedDate] = await Promise.all([
    prisma.schedule.findFirst({
      where: {
        tenantId: context.tenantId,
        barbershopId: context.barbershopId,
        barberId: barber.id,
        dayOfWeek,
        isAvailable: true,
      },
      select: { startTime: true, endTime: true },
    }),
    prisma.barberBlockedDate.findFirst({
      where: { tenantId: context.tenantId, barberId: barber.id, date: dateStr },
      select: { id: true, reason: true },
    }),
  ]);

  if (!schedule) {
    throw new Error("El barbero no atiende en ese dia");
  }

  if (blockedDate) {
    const msg = blockedDate.reason
      ? `El barbero no está disponible ese día: ${blockedDate.reason}`
      : "El barbero no está disponible ese día";
    throw new Error(msg);
  }

  if (hourMinute < schedule.startTime || hourMinute >= schedule.endTime) {
    throw new Error("La hora seleccionada esta fuera del horario disponible");
  }

  const availability = await checkSlotAvailability(
    context.tenantId,
    context.barbershopId,
    barber.id,
    starts,
    ends,
  );

  if (!availability.available) {
    throw new Error(availability.conflict ?? "Horario ocupado");
  }

  let clientId = dto.clientId;

  if (!clientId) {
    if (!dto.clientName || !dto.clientPhone) {
      throw new Error("Se requiere clientId o (clientName + clientPhone)");
    }

    const phone = normalizePhone(dto.clientPhone);
    const client = await prisma.client.upsert({
      where: {
        barbershopId_phone: {
          barbershopId: context.barbershopId,
          phone,
        },
      },
      update: {
        name: dto.clientName,
        email: dto.clientEmail ?? undefined,
      },
      create: {
        tenantId: context.tenantId,
        barbershopId: context.barbershopId,
        name: dto.clientName,
        phone,
        email: dto.clientEmail ?? null,
      },
    });

    clientId = client.id;
  }

  const appointment = await prisma.$transaction(async (tx) => {
    const created = await tx.appointment.create({
      data: {
        tenantId: context.tenantId,
        barbershopId: context.barbershopId,
        barberId: barber.id,
        serviceId: service.id,
        clientId: clientId!,
        startsAt: starts,
        endsAt: ends,
        price: service.price,
        total: service.price,
        notes: dto.notes ?? null,
        status: "confirmed",
      },
      include: {
        barber:  { select: { id: true, name: true } },
        service: { select: { id: true, name: true, durationMin: true } },
        client:  { select: { id: true, name: true, phone: true } },
      },
    });

    await tx.client.update({
      where: { id: clientId! },
      data: {
        totalVisits: { increment: 1 },
        lastVisitAt: starts,
      },
    });

    await tx.appointmentHistory.create({
      data: {
        tenantId: context.tenantId,
        appointmentId: created.id,
        status: "confirmed",
        observations: "Cita creada",
        servicePerformed: created.service.name,
      },
    });

    return created;
  });

  if (tenant.autoConfirmacion && isTwilioConfigured() && appointment.client.phone) {
    const baseUrl = process.env.NEXTAUTH_URL ?? "https://vanttage.app";
    const message = buildConfirmationMessage({
      clientName: appointment.client.name,
      barberName: appointment.barber.name,
      serviceName: appointment.service.name,
      startsAt: appointment.startsAt,
      tenantName: context.barbershopName,
      address: barbershop.address ?? tenant.address ?? undefined,
      appointmentUrl: `${baseUrl}/mi-cita/${appointment.id}`,
    });

    const waResult = await sendWhatsAppText({
      to: appointment.client.phone,
      text: message,
    });

    await prisma.notification.create({
      data: {
        tenantId: context.tenantId,
        barbershopId: context.barbershopId,
        appointmentId: appointment.id,
        clientId: appointment.client.id,
        channel: "whatsapp",
        type: "appointment_confirmed",
        status: waResult.success ? "sent" : "failed",
        recipient: appointment.client.phone,
        title: "Confirmacion de cita",
        message,
        errorMessage: waResult.error,
        sentAt: waResult.success ? new Date() : null,
      },
    });

    if (waResult.success) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { confirmationSentAt: new Date() },
      });
    }
  }

  // ── Notificar al dueño / barbershop ──────────────────────────────────────
  const adminPhone = barbershop.whatsapp ?? tenant.phoneWa ?? null;
  if (adminPhone && isTwilioConfigured()) {
    const baseUrl = process.env.NEXTAUTH_URL ?? "https://vanttage.app";
    const adminMsg = buildNewBookingAdminMessage({
      clientName:   appointment.client.name,
      clientPhone:  appointment.client.phone,
      barberName:   appointment.barber.name,
      serviceName:  appointment.service.name,
      startsAt:     appointment.startsAt,
      tenantName:   context.barbershopName,
      appointmentUrl: `${baseUrl}/mi-cita/${appointment.id}`,
    });

    await sendWhatsAppText({ to: adminPhone, text: adminMsg }).catch((err) =>
      console.error("[WA] Admin notification failed:", err),
    );
  }

  return appointment;
}

export async function getDashboardStats(
  context: Pick<SchedulerContext, "tenantId" | "barbershopId">,
): Promise<DashboardStats> {
  const now = new Date();
  // Usar Colombia (UTC-5) para definir "hoy" — garantiza consistencia con el
  // frontend y evita que citas vespertinas caigan en el día UTC equivocado.
  const today     = colStartOfToday(now);
  const todayEnd  = new Date(today.getTime() + 24 * 60 * 60_000 - 1);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60_000);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const { weekStart, weekEnd } = getWeekRange(now);

  const commonWhere = {
    tenantId: context.tenantId,
    barbershopId: context.barbershopId,
  };

  // ── 11 consultas paralelas (antes eran 14) ────────────────────────────────
  // Optimizaciones:
  //   · citasHoy = apptsTotalesHoy → 1 sola query
  //   · apptsCompletadasHoy derivado de ingresosHoyRaw.length
  //   · citasSemana derivado de weeklyRaw al final
  const [
    citasHoy,          // 1  — citas hoy (not cancelled) — también sirve como apptsTotalesHoy
    citasAyer,         // 2
    ingresosHoyRaw,    // 3  — completed hoy → su .length = apptsCompletadasHoy
    apptsMes,          // 4
    apptsAnterior,     // 5
    clientesActivos,   // 6
    clientesNuevos,    // 7
    weeklyRaw,         // 8  — su .filter dará citasSemana
    topServiceGroups,  // 9
    topBarberGroups,   // 10
    frequentClientGroups, // 11
  ] = await Promise.all([
    // 1 — hoy (not cancelled) — fusionado con apptsTotalesHoy (idénticos)
    prisma.appointment.count({
      where: {
        ...commonWhere,
        startsAt: { gte: today, lte: todayEnd },
        status: { not: "cancelled" },
      },
    }),
    // 2
    prisma.appointment.count({
      where: {
        ...commonWhere,
        startsAt: { gte: yesterday, lt: today },
        status: { not: "cancelled" },
      },
    }),
    // 3 — completed hoy: su .length es apptsCompletadasHoy, su sum es ingresosHoy
    prisma.appointment.findMany({
      where: {
        ...commonWhere,
        startsAt: { gte: today, lte: todayEnd },
        status: "completed",
      },
      select: { total: true },
    }),
    // 4
    prisma.appointment.findMany({
      where: {
        ...commonWhere,
        startsAt: { gte: monthStart, lte: monthEnd },
        status: "completed",
      },
      select: { total: true },
    }),
    // 5
    prisma.appointment.findMany({
      where: {
        ...commonWhere,
        startsAt: { gte: prevMonthStart, lte: prevMonthEnd },
        status: "completed",
      },
      select: { total: true },
    }),
    // 6
    prisma.client.count({ where: { ...commonWhere, active: true } }),
    // 7
    prisma.client.count({
      where: { ...commonWhere, createdAt: { gte: monthStart } },
    }),
    // 8 — toda la semana; citasSemana se deriva aquí
    prisma.appointment.findMany({
      where: {
        ...commonWhere,
        startsAt: { gte: weekStart, lte: weekEnd },
      },
      select: { startsAt: true, total: true, status: true },
    }),
    // 9
    prisma.appointment.groupBy({
      by: ["serviceId"],
      where: {
        ...commonWhere,
        startsAt: { gte: monthStart, lte: monthEnd },
        status: { in: ["confirmed", "in_progress", "completed"] },
      },
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: 5,
    }),
    // 10
    prisma.appointment.groupBy({
      by: ["barberId"],
      where: {
        ...commonWhere,
        startsAt: { gte: monthStart, lte: monthEnd },
        status: { in: ["confirmed", "in_progress", "completed"] },
      },
      _count: { barberId: true },
      orderBy: { _count: { barberId: "desc" } },
      take: 1,
    }),
    // 11
    prisma.appointment.groupBy({
      by: ["clientId"],
      where: {
        ...commonWhere,
        startsAt: { gte: monthStart, lte: monthEnd },
        status: "completed",
      },
      _count: { clientId: true },
      orderBy: { _count: { clientId: "desc" } },
      take: 5,
    }),
  ]);

  // ── Derivar valores de las queries ya ejecutadas ──────────────────────────
  const apptsCompletadasHoy = ingresosHoyRaw.length;
  const apptsTotalesHoy     = citasHoy; // son idénticos
  const citasSemana         = weeklyRaw.filter((a) => a.status !== "cancelled").length;

  const ingresosHoy      = ingresosHoyRaw.reduce((s, a) => s + a.total, 0);
  const ingresosMes      = apptsMes.reduce((s, a) => s + a.total, 0);
  const ingresosAnterior = apptsAnterior.reduce((s, a) => s + a.total, 0);

  const ingresosMonthDelta =
    ingresosAnterior > 0
      ? Math.round(((ingresosMes - ingresosAnterior) / ingresosAnterior) * 100)
      : 0;
  const citasHoyDelta =
    citasAyer > 0 ? Math.round(((citasHoy - citasAyer) / citasAyer) * 100) : 0;
  const tasaAsistencia =
    apptsTotalesHoy > 0
      ? Math.round((apptsCompletadasHoy / apptsTotalesHoy) * 100)
      : 0;

  // ── Datos semanales para el chart ─────────────────────────────────────────
  const dayLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  const weeklyMap = new Map<number, { citas: number; ingresos: number }>();
  for (let index = 0; index < 7; index++) {
    weeklyMap.set(index, { citas: 0, ingresos: 0 });
  }

  for (const item of weeklyRaw) {
    const key = new Date(item.startsAt).getDay();
    const current = weeklyMap.get(key)!;
    if (item.status !== "cancelled") current.citas += 1;
    if (item.status === "completed") current.ingresos += item.total;
    weeklyMap.set(key, current);
  }

  const weeklyData = [1, 2, 3, 4, 5, 6, 0].map((index) => ({
    day: dayLabels[index],
    citas: weeklyMap.get(index)?.citas ?? 0,
    ingresos: weeklyMap.get(index)?.ingresos ?? 0,
  }));

  // ── Segunda ronda: nombres de servicios, barberos y clientes ─────────────
  const serviceIds = topServiceGroups.map((g) => g.serviceId);
  const barberIds  = topBarberGroups.map((g) => g.barberId);
  const clientIds  = frequentClientGroups.map((g) => g.clientId);

  const [services, barbers, clients] = await Promise.all([
    serviceIds.length
      ? prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    barberIds.length
      ? prisma.barber.findMany({
          where: { id: { in: barberIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    clientIds.length
      ? prisma.client.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const serviceMap = new Map(services.map((s) => [s.id, s.name]));
  const barberMap  = new Map(barbers.map((b) => [b.id, b.name]));
  const clientMap  = new Map(clients.map((c) => [c.id, c.name]));

  return {
    citasHoy,
    citasSemana,
    ingresosHoy,
    ingresosMes,
    ingresosSemana: weeklyData.reduce((s, d) => s + d.ingresos, 0),
    clientesActivos,
    clientesNuevos,
    tasaAsistencia,
    citasHoyDelta,
    ingresosMonthDelta,
    weeklyData,
    topServices: topServiceGroups.map((g) => ({
      label: serviceMap.get(g.serviceId) ?? "Servicio",
      value: g._count.serviceId,
    })),
    topBarber: topBarberGroups[0]
      ? {
          id: topBarberGroups[0].barberId,
          name: barberMap.get(topBarberGroups[0].barberId) ?? "Barbero",
          reservations: topBarberGroups[0]._count.barberId,
        }
      : null,
    clientesFrecuentes: frequentClientGroups.map((g) => ({
      id: g.clientId,
      name: clientMap.get(g.clientId) ?? "Cliente",
      visits: g._count.clientId,
    })),
  };
}

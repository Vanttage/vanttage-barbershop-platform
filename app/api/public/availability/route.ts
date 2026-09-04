import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getTenantContext } from "@/src/lib/tenant";

/**
 * Disponibilidad real para la página pública de reservas.
 *
 * Antes, /reservar mostraba una lista de horas fija (09:00–17:30, domingo
 * siempre cerrado) sin ninguna relación con el horario real del barbero
 * (el que configuramos en Barberos) ni con las citas que ya existen. Un
 * cliente podía elegir una hora que nunca iba a funcionar y solo se
 * enteraba al final, después de llenar sus datos. Este endpoint calcula
 * los horarios que realmente están libres, usando la misma fuente de
 * verdad que Agenda: Schedule + Appointment.
 *
 * ?barberId=any calcula la unión de disponibilidad de todos los barberos
 * activos, y además devuelve qué barbero(s) están libres en cada horario
 * — así "sin preferencia" puede asignar a alguien realmente disponible en
 * vez de siempre elegir el primero de la lista sin comprobar nada.
 */

const SLOT_STEP_MIN = 15;

export async function GET(request: NextRequest) {
  const slugFromQuery = request.nextUrl.searchParams.get("tenantSlug");
  const ctx = await getTenantContext(slugFromQuery);
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const dateStr = request.nextUrl.searchParams.get("date");
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const barberIdParam = request.nextUrl.searchParams.get("barberId");

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !serviceId) {
    return NextResponse.json(
      { error: "date (YYYY-MM-DD) y serviceId son obligatorios" },
      { status: 400 },
    );
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId, active: true },
    select: { durationMin: true },
  });
  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado o inactivo" }, { status: 404 });
  }

  const candidateBarbers = await prisma.barber.findMany({
    where: {
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
      active: true,
      ...(barberIdParam && barberIdParam !== "any" ? { id: barberIdParam } : {}),
    },
    select: { id: true },
  });

  if (candidateBarbers.length === 0) {
    return NextResponse.json({ data: { slots: [], slotBarbers: {} } });
  }

  const barberIds = candidateBarbers.map((b) => b.id);
  // Mediodía evita que un cambio de zona horaria empuje la fecha al día
  // anterior/siguiente al calcular getDay().
  const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();
  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999`);

  const [schedules, existingAppointments] = await Promise.all([
    prisma.schedule.findMany({
      where: { barberId: { in: barberIds }, dayOfWeek, isAvailable: true },
      select: { barberId: true, startTime: true, endTime: true },
    }),
    prisma.appointment.findMany({
      where: {
        barberId: { in: barberIds },
        status: { in: ["pending", "confirmed", "in_progress"] },
        startsAt: { gte: dayStart, lte: dayEnd },
      },
      select: { barberId: true, startsAt: true, endsAt: true },
    }),
  ]);

  const scheduleByBarber = new Map(schedules.map((s) => [s.barberId, s]));
  const slotBarbers: Record<string, string[]> = {};

  for (const barberId of barberIds) {
    const schedule = scheduleByBarber.get(barberId);
    if (!schedule) continue; // no atiende ese día de la semana

    const barberAppts = existingAppointments.filter((a) => a.barberId === barberId);
    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    for (let t = startMin; t + service.durationMin <= endMin; t += SLOT_STEP_MIN) {
      const hh = String(Math.floor(t / 60)).padStart(2, "0");
      const mm = String(t % 60).padStart(2, "0");
      const candidateStart = new Date(`${dateStr}T${hh}:${mm}:00`);
      const candidateEnd = new Date(candidateStart.getTime() + service.durationMin * 60_000);

      const conflict = barberAppts.some(
        (a) => candidateStart < new Date(a.endsAt) && candidateEnd > new Date(a.startsAt),
      );
      if (conflict) continue;

      const key = `${hh}:${mm}`;
      if (!slotBarbers[key]) slotBarbers[key] = [];
      slotBarbers[key].push(barberId);
    }
  }

  const slots = Object.keys(slotBarbers).sort();

  return NextResponse.json({ data: { slots, slotBarbers } });
}

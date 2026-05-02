import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getTenantContext } from "@/src/lib/tenant";

/** Genera slots de N minutos entre startTime y endTime (formato "HH:MM") */
function generateSlots(
  startTime: string,
  endTime: string,
  durationMin: number,
): string[] {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins   = eh * 60 + em;

  const slots: string[] = [];
  for (let t = startMins; t + durationMin <= endMins; t += 30) {
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const slugFromQuery = q.get("tenantSlug");
  const barberId  = q.get("barberId");
  const date      = q.get("date");    // YYYY-MM-DD
  const serviceId = q.get("serviceId");

  if (!barberId || !date || !serviceId) {
    return NextResponse.json(
      { error: "Se requieren barberId, date (YYYY-MM-DD) y serviceId" },
      { status: 400 },
    );
  }

  const ctx = await getTenantContext(slugFromQuery);
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  // Colombia es UTC-5 — el día seleccionado empieza a las 05:00 UTC
  const dayStart = new Date(`${date}T05:00:00.000Z`);
  const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60_000 - 1);

  const jsDate    = new Date(`${date}T12:00:00`);
  const dayOfWeek = jsDate.getDay();

  const [service, schedule, blockedDate, existingAppts] = await Promise.all([
    prisma.service.findFirst({
      where: {
        id: serviceId,
        tenantId: ctx.tenantId,
        barbershopId: ctx.barbershopId,
        active: true,
      },
      select: { durationMin: true },
    }),
    prisma.schedule.findFirst({
      where: {
        barberId,
        tenantId: ctx.tenantId,
        barbershopId: ctx.barbershopId,
        dayOfWeek,
        isAvailable: true,
      },
      select: { startTime: true, endTime: true },
    }),
    prisma.barberBlockedDate.findFirst({
      where: { barberId, tenantId: ctx.tenantId, date },
      select: { id: true, reason: true },
    }),
    prisma.appointment.findMany({
      where: {
        barberId,
        tenantId: ctx.tenantId,
        barbershopId: ctx.barbershopId,
        status: { in: ["pending", "confirmed", "in_progress"] },
        startsAt: { gte: dayStart, lte: dayEnd },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }
  if (!schedule) {
    return NextResponse.json({ data: { slots: [], reason: "Barbero no disponible este día" } });
  }
  if (blockedDate) {
    return NextResponse.json({
      data: {
        slots: [],
        reason: blockedDate.reason ?? "Barbero no disponible este día",
      },
    });
  }

  const allSlots = generateSlots(schedule.startTime, schedule.endTime, service.durationMin);

  // Filtrar slots que solapan con citas existentes
  const availableSlots = allSlots.filter((slotTime) => {
    const [sh, sm] = slotTime.split(":").map(Number);
    // Construir fecha UTC equivalente a ese slot en Colombia
    const slotStartMs = dayStart.getTime() + (sh * 60 + sm) * 60_000;
    const slotEndMs   = slotStartMs + service.durationMin * 60_000;

    return !existingAppts.some((appt) => {
      const apptStart = new Date(appt.startsAt).getTime();
      const apptEnd   = new Date(appt.endsAt).getTime();
      // Solapamiento
      return slotStartMs < apptEnd && slotEndMs > apptStart;
    });
  });

  // Filtrar slots que ya pasaron (si el día es hoy)
  const todayStr = new Date(Date.now() - 5 * 60 * 60_000).toISOString().slice(0, 10);
  const nowMins  = (() => {
    if (date !== todayStr) return -1;
    const coNow = new Date(Date.now() - 5 * 60 * 60_000);
    return coNow.getUTCHours() * 60 + coNow.getUTCMinutes() + 30; // +30 min buffer
  })();

  const finalSlots = availableSlots.filter((slot) => {
    if (nowMins < 0) return true;
    const [h, m] = slot.split(":").map(Number);
    return h * 60 + m > nowMins;
  });

  return NextResponse.json({ data: { slots: finalSlots, reason: null } });
}

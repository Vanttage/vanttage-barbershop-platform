import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { UpdateScheduleSchema, validateBody } from "@/src/validations";

type Params = { params: Promise<{ id: string }> };

/**
 * Reemplaza el horario semanal completo de un barbero (los 7 días).
 * Cada día se guarda como upsert sobre la constraint única
 * (barberId, dayOfWeek) — nunca se duplica ni se pierde un día.
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
  const barber = await prisma.barber.findFirst({
    where: { id, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
  });

  if (!barber) {
    return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = validateBody(UpdateScheduleSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updated = await prisma.$transaction(
    parsed.data.schedules.map((day) =>
      prisma.schedule.upsert({
        where: {
          barberId_dayOfWeek: { barberId: id, dayOfWeek: day.dayOfWeek },
        },
        update: {
          isAvailable: day.isAvailable,
          startTime: day.startTime,
          endTime: day.endTime,
        },
        create: {
          tenantId: ctx.tenantId,
          barbershopId: ctx.barbershopId,
          barberId: id,
          dayOfWeek: day.dayOfWeek,
          isAvailable: day.isAvailable,
          startTime: day.startTime,
          endTime: day.endTime,
        },
      }),
    ),
  );

  return NextResponse.json({
    data: updated.sort((a, b) => a.dayOfWeek - b.dayOfWeek),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: barberId } = await params;

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const schedules = await prisma.schedule.findMany({
    where: { barberId, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
    select: { dayOfWeek: true, startTime: true, endTime: true, isAvailable: true },
    orderBy: { dayOfWeek: "asc" },
  });

  // Rellenar los 7 días — los que no existen en DB se marcan como no disponibles
  const DEFAULT_START = "09:00";
  const DEFAULT_END   = "19:00";
  const filled = Array.from({ length: 7 }, (_, day) => {
    const found = schedules.find((s) => s.dayOfWeek === day);
    return found ?? { dayOfWeek: day, startTime: DEFAULT_START, endTime: DEFAULT_END, isAvailable: false };
  });

  return NextResponse.json({ data: filled });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: barberId } = await params;
  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const schedules = body.schedules as Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;

  if (!Array.isArray(schedules) || schedules.length === 0) {
    return NextResponse.json({ error: "Se requiere un array de horarios" }, { status: 400 });
  }

  // Validar formato HH:MM
  const timeRe = /^\d{2}:\d{2}$/;
  for (const s of schedules) {
    if (!timeRe.test(s.startTime) || !timeRe.test(s.endTime)) {
      return NextResponse.json({ error: "Formato de hora inválido (HH:MM)" }, { status: 400 });
    }
    if (s.startTime >= s.endTime) {
      return NextResponse.json(
        { error: `La hora de inicio debe ser anterior a la de cierre (día ${s.dayOfWeek})` },
        { status: 400 },
      );
    }
  }

  // Upsert atómico por cada día
  await prisma.$transaction(
    schedules.map((s) =>
      prisma.schedule.upsert({
        where: {
          barberId_dayOfWeek: { barberId, dayOfWeek: s.dayOfWeek },
        },
        update: {
          startTime:   s.startTime,
          endTime:     s.endTime,
          isAvailable: s.isAvailable,
        },
        create: {
          tenantId:    ctx.tenantId,
          barbershopId: ctx.barbershopId,
          barberId,
          dayOfWeek:   s.dayOfWeek,
          startTime:   s.startTime,
          endTime:     s.endTime,
          isAvailable: s.isAvailable,
        },
      }),
    ),
  );

  return NextResponse.json({ data: { ok: true } });
}

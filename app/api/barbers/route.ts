import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { CreateBarberSchema, validateBody } from "@/src/validations";

export async function GET(request: NextRequest) {
  const slugFromQuery = request.nextUrl.searchParams.get("tenantSlug");
  const ctx = await getTenantContext(slugFromQuery);
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const onlyActive = request.nextUrl.searchParams.get("active") !== "false";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const barbers = await prisma.barber.findMany({
    where: {
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
      ...(onlyActive ? { active: true } : {}),
    },
    include: {
      schedules: true,
      _count: { select: { appointments: true, favorites: true } },
      appointments: {
        where: {
          startsAt: { gte: today, lte: todayEnd },
          status: { not: "cancelled" },
        },
        select: { id: true },
      },
    },
    orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
  });

  const result = barbers.map((barber) => ({
    ...barber,
    appointmentsToday: barber.appointments.length,
    favoriteCount: barber._count.favorites,
    appointments: undefined,
  }));

  const res = NextResponse.json({ data: result });
  // Barbers cambian poco — cachear 30 s en el cliente, aceptar stale 60 s
  res.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
  return res;
}

export async function POST(request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = validateBody(CreateBarberSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const lastBarber = await prisma.barber.findFirst({
    where: {
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
    },
    orderBy: { orderIndex: "desc" },
  });

  const barber = await prisma.barber.create({
    data: {
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
      ...parsed.data,
      orderIndex: (lastBarber?.orderIndex ?? 0) + 1,
    },
  });

  await prisma.schedule.createMany({
    data: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
      barberId: barber.id,
      dayOfWeek,
      startTime: "09:00",
      endTime: "19:00",
      isAvailable: true,
    })),
  });

  return NextResponse.json({ data: barber }, { status: 201 });
}

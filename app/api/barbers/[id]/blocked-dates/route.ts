import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

  const { id } = await params;

  const blocked = await prisma.barberBlockedDate.findMany({
    where: { tenantId: ctx.tenantId, barberId: id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ data: blocked });
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();
  const { date, reason } = body as { date?: string; reason?: string };

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Fecha inválida. Usar formato YYYY-MM-DD" }, { status: 400 });
  }

  const barber = await prisma.barber.findFirst({
    where: { id, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
    select: { id: true },
  });
  if (!barber) return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });

  const blocked = await prisma.barberBlockedDate.upsert({
    where: { barberId_date: { barberId: id, date } },
    update: { reason: reason ?? null },
    create: { tenantId: ctx.tenantId, barberId: id, date, reason: reason ?? null },
  });

  return NextResponse.json({ data: blocked }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

  const { id } = await params;
  const date = req.nextUrl.searchParams.get("date");

  if (!date) return NextResponse.json({ error: "Se requiere ?date=YYYY-MM-DD" }, { status: 400 });

  await prisma.barberBlockedDate.deleteMany({
    where: { tenantId: ctx.tenantId, barberId: id, date },
  });

  return NextResponse.json({ data: { ok: true } });
}

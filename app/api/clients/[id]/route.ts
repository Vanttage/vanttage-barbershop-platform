import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { UpdateClientSchema, validateBody } from "@/src/validations";

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
  const client = await prisma.client.findFirst({
    where: { id, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
    include: {
      _count: { select: { appointments: true } },
      appointments: {
        orderBy: { startsAt: "desc" },
        take: 5,
        include: {
          service: { select: { id: true, name: true, price: true } },
          barber: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: client });
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
  const existing = await prisma.client.findFirst({
    where: { id, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = validateBody(UpdateClientSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updated = await prisma.client.update({
    where: { id },
    data: {
      ...parsed.data,
      email: parsed.data.email === "" ? null : parsed.data.email,
    },
  });

  return NextResponse.json({ data: updated });
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
  const existing = await prisma.client.findFirst({
    where: { id, tenantId: ctx.tenantId, barbershopId: ctx.barbershopId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  await prisma.client.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}

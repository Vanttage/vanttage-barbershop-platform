import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { normalizeColombianPhone } from "@/src/lib/whatsapp";
import {
  ClientsQuerySchema,
  CreateClientSchema,
  validateBody,
} from "@/src/validations";

export async function GET(request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const raw = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = validateBody(ClientsQuerySchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { search, inactive, page, limit } = parsed.data;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    tenantId: ctx.tenantId,
    barbershopId: ctx.barbershopId,
    active: true,
    ...(inactive ? { lastVisitAt: { lt: thirtyDaysAgo } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        _count: { select: { appointments: true, favorites: true } },
      },
      orderBy: [{ totalVisits: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  return NextResponse.json({
    data: clients,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
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
  const parsed = validateBody(CreateClientSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const normalizedPhone = normalizeColombianPhone(parsed.data.phone);
  const existing = await prisma.client.findUnique({
    where: {
      barbershopId_phone: {
        barbershopId: ctx.barbershopId,
        phone: normalizedPhone,
      },
    },
  });

  if (existing) {
    const updated = await prisma.client.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email || null,
        notes: parsed.data.notes ?? existing.notes,
      },
    });

    return NextResponse.json({ data: updated, isNew: false });
  }

  const client = await prisma.client.create({
    data: {
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
      name: parsed.data.name,
      phone: normalizedPhone,
      email: parsed.data.email || null,
      notes: parsed.data.notes ?? null,
    },
  });

  return NextResponse.json({ data: client, isNew: true }, { status: 201 });
}

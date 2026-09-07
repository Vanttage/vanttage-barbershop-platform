import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { validateBody } from "@/src/validations";

type Params = { params: Promise<{ id: string }> };

const UpdateTenantSchema = z.object({
  active: z.boolean().optional(),
  plan: z.enum(["basico", "pro", "premium"]).optional(),
});

/** Detalle de un tenant para el drawer del panel superadmin. */
export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireUserWithRole(["superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      primaryBarbershop: { select: { city: true, phone: true, whatsapp: true, address: true } },
      users: {
        where: { role: "owner" },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, email: true, phone: true, lastLoginAt: true, createdAt: true },
      },
      _count: { select: { appointments: true, clients: true, barbers: true, services: true } },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const lastAppointment = await prisma.appointment.findFirst({
    where: { tenantId: id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  return NextResponse.json({
    data: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      active: tenant.active,
      createdAt: tenant.createdAt,
      city: tenant.primaryBarbershop?.city ?? tenant.city,
      phone: tenant.primaryBarbershop?.phone ?? null,
      whatsapp: tenant.primaryBarbershop?.whatsapp ?? tenant.phoneWa,
      address: tenant.primaryBarbershop?.address ?? tenant.address,
      telegramEnabled: tenant.telegramEnabled,
      automations: {
        autoConfirmacion: tenant.autoConfirmacion,
        autoReminder24h: tenant.autoReminder24h,
        autoReminder1h: tenant.autoReminder1h,
        autoReviewRequest: tenant.autoReviewRequest,
        autoReactivacion: tenant.autoReactivacion,
        autoWeeklyReport: tenant.autoWeeklyReport,
      },
      owner: tenant.users[0] ?? null,
      counts: tenant._count,
      lastAppointmentAt: lastAppointment?.createdAt ?? null,
    },
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireUserWithRole(["superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = validateBody(UpdateTenantSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updated = await prisma.tenant.update({
    where: { id },
    data: parsed.data,
    include: {
      _count: { select: { appointments: true, clients: true, barbers: true } },
    },
  });

  return NextResponse.json({ data: updated });
}

/**
 * Elimina un tenant y todo lo que cuelga de él (cascade en el schema).
 * Requiere que el body traiga { confirmSlug } igual al slug real del
 * tenant — defensa extra además de la confirmación en la UI, porque esto
 * es irreversible.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireUserWithRole(["superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const existing = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const confirmSlug = typeof body?.confirmSlug === "string" ? body.confirmSlug : "";
  if (confirmSlug !== existing.slug) {
    return NextResponse.json(
      { error: "El slug de confirmación no coincide." },
      { status: 400 },
    );
  }

  // primaryBarbershopId apunta a Barbershop, que a su vez apunta de vuelta
  // al tenant con cascade — se rompe la referencia circular antes de borrar.
  await prisma.tenant.update({ where: { id }, data: { primaryBarbershopId: null } });
  await prisma.tenant.delete({ where: { id } });

  return NextResponse.json({ data: { ok: true } });
}

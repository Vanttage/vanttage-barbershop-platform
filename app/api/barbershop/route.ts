import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { UpdateBarbershopSettingsSchema, validateBody } from "@/src/validations";

function nullable(value?: string) {
  return value?.trim() ? value.trim() : null;
}

export async function GET() {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const [tenant, barbershop] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { id: true, name: true, slug: true, plan: true },
    }),
    prisma.barbershop.findUnique({
      where: { id: ctx.barbershopId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        address: true,
        city: true,
        country: true,
        phone: true,
        whatsapp: true,
        instagram: true,
        openingTime: true,
        closingTime: true,
      },
    }),
  ]);

  if (!tenant || !barbershop) {
    return NextResponse.json({ error: "Configuracion no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      plan: tenant.plan,
      barbershopId: barbershop.id,
      barbershopName: barbershop.name,
      barbershopSlug: barbershop.slug,
      description: barbershop.description,
      logoUrl: barbershop.logoUrl,
      bannerUrl: barbershop.bannerUrl,
      address: barbershop.address,
      city: barbershop.city,
      country: barbershop.country,
      phone: barbershop.phone,
      whatsapp: barbershop.whatsapp,
      instagram: barbershop.instagram,
      openingTime: barbershop.openingTime,
      closingTime: barbershop.closingTime,
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = validateBody(UpdateBarbershopSettingsSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        name: parsed.data.tenantName.trim(),
        city: nullable(parsed.data.city),
        phoneWa: nullable(parsed.data.whatsapp),
      },
    });

    return tx.barbershop.update({
      where: { id: ctx.barbershopId },
      data: {
        name: parsed.data.barbershopName.trim(),
        description: nullable(parsed.data.description),
        logoUrl: nullable(parsed.data.logoUrl),
        bannerUrl: nullable(parsed.data.bannerUrl),
        address: nullable(parsed.data.address),
        city: nullable(parsed.data.city),
        country: nullable(parsed.data.country),
        phone: nullable(parsed.data.phone),
        whatsapp: nullable(parsed.data.whatsapp),
        instagram: nullable(parsed.data.instagram),
        openingTime: parsed.data.openingTime,
        closingTime: parsed.data.closingTime,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        address: true,
        city: true,
        country: true,
        phone: true,
        whatsapp: true,
        instagram: true,
        openingTime: true,
        closingTime: true,
      },
    });
  });

  return NextResponse.json({
    data: {
      tenantName: parsed.data.tenantName.trim(),
      tenantSlug: ctx.tenantSlug,
      barbershopId: updated.id,
      barbershopName: updated.name,
      barbershopSlug: updated.slug,
      description: updated.description,
      logoUrl: updated.logoUrl,
      bannerUrl: updated.bannerUrl,
      address: updated.address,
      city: updated.city,
      country: updated.country,
      phone: updated.phone,
      whatsapp: updated.whatsapp,
      instagram: updated.instagram,
      openingTime: updated.openingTime,
      closingTime: updated.closingTime,
    },
  });
}

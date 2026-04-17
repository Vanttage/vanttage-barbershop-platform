import { NextResponse } from "next/server";
import { getCurrentTenant, getTenantContext } from "@/src/lib/tenant";

export async function GET() {
  const [tenant, ctx] = await Promise.all([getCurrentTenant(), getTenantContext()]);

  if (!tenant || !ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      barbershopName: ctx.barbershopName,
      barbershopSlug: ctx.barbershopSlug,
      city: tenant.primaryBarbershop?.city ?? tenant.city ?? null,
      address: tenant.primaryBarbershop?.address ?? tenant.address ?? null,
      instagram: tenant.primaryBarbershop?.instagram ?? null,
      whatsapp: tenant.primaryBarbershop?.whatsapp ?? tenant.phoneWa ?? null,
      openingTime: tenant.primaryBarbershop?.openingTime ?? null,
      closingTime: tenant.primaryBarbershop?.closingTime ?? null,
    },
  });
}

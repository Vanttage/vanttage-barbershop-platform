import { headers } from "next/headers";
import { prisma } from "@/src/lib/prisma";

const RESERVED_SLUGS = new Set(["www", "app", "admin", "api", "static", "cdn"]);

export function extractSlugFromHost(host: string) {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "vanttage.app";

  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return process.env.VANTTAGE_DEV_TENANT ?? null;
  }

  if (host.endsWith(`.${baseDomain}`)) {
    const slug = host.replace(`.${baseDomain}`, "");
    return RESERVED_SLUGS.has(slug) ? null : slug;
  }

  return null;
}

export async function getTenantBySlug(slug: string) {
  if (!slug) return null;

  return prisma.tenant.findUnique({
    where: { slug },
    include: {
      primaryBarbershop: true,
      barbershops: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });
}

export async function getCurrentTenant() {
  const ctx = await getTenantContext();
  if (!ctx) return null;

  return prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    include: {
      primaryBarbershop: true,
    },
  });
}

export type TenantContext = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  barbershopId: string;
  barbershopSlug: string;
  barbershopName: string;
};

export async function getTenantContext(): Promise<TenantContext | null> {
  const headersList = await headers();
  const tenantSlug =
    headersList.get("x-tenant-slug") ??
    (process.env.NODE_ENV === "development"
      ? process.env.VANTTAGE_DEV_TENANT ?? null
      : null);

  if (!tenantSlug) {
    return null;
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant || !tenant.active) {
    return null;
  }

  const barbershop = tenant.primaryBarbershop ?? tenant.barbershops[0];
  if (!barbershop || !barbershop.active) {
    return null;
  }

  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    barbershopId: barbershop.id,
    barbershopSlug: barbershop.slug,
    barbershopName: barbershop.name,
  };
}

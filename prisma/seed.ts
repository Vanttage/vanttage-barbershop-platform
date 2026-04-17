// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · prisma/seed.ts
//
//  Seed mínimo: crea SOLO el superadmin y un tenant inicial real.
//  Los datos operativos (clientes, citas, etc.) los ingresa el dueño
//  desde el panel — no se pre-cargan datos falsos.
//
//  Variables de entorno opcionales:
//    SUPERADMIN_EMAIL    (default: superadmin@vanttage.app)
//    SUPERADMIN_PASSWORD (default: Vanttage2026* — CAMBIAR en prod)
//    SEED_TENANT_NAME    (default: Mi Barbería)
//    SEED_TENANT_SLUG    (default: mi-barberia)
//    SEED_OWNER_EMAIL    (default: owner@mi-barberia.co)
//    SEED_OWNER_PASSWORD (default: Owner2026*)
// ─────────────────────────────────────────────────────────────────────────────

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── 1. Superadmin ──────────────────────────────────────────────────────────
  const SUPERADMIN_EMAIL    = process.env.SUPERADMIN_EMAIL    ?? "superadmin@vanttage.app";
  const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD ?? "Vanttage2026*";
  const superHash = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);

  await prisma.user.upsert({
    where:  { email: SUPERADMIN_EMAIL },
    update: { passwordHash: superHash, role: "superadmin", active: true },
    create: {
      email: SUPERADMIN_EMAIL,
      passwordHash: superHash,
      name: "VANTTAGE Admin",
      role: "superadmin",
      active: true,
    },
  });
  console.log(`✅ Superadmin: ${SUPERADMIN_EMAIL}`);

  // ── 2. Tenant inicial ──────────────────────────────────────────────────────
  const TENANT_NAME    = process.env.SEED_TENANT_NAME    ?? "Mi Barbería";
  const TENANT_SLUG    = process.env.SEED_TENANT_SLUG    ?? "mi-barberia";
  const OWNER_EMAIL    = process.env.SEED_OWNER_EMAIL    ?? "owner@mi-barberia.co";
  const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "Owner2026*";
  const ownerHash = await bcrypt.hash(OWNER_PASSWORD, 12);

  const tenant = await prisma.tenant.upsert({
    where:  { slug: TENANT_SLUG },
    update: { name: TENANT_NAME, active: true },
    create: {
      name:   TENANT_NAME,
      slug:   TENANT_SLUG,
      plan:   "pro",
      active: true,
    },
  });

  const barbershop = await prisma.barbershop.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: TENANT_SLUG } },
    update: { name: TENANT_NAME, active: true },
    create: {
      tenantId:    tenant.id,
      name:        TENANT_NAME,
      slug:        TENANT_SLUG,
      openingTime: "09:00",
      closingTime: "19:00",
      timezone:    "America/Bogota",
      active:      true,
    },
  });

  await prisma.tenant.update({
    where: { id: tenant.id },
    data:  { primaryBarbershopId: barbershop.id },
  });

  const owner = await prisma.user.upsert({
    where:  { email: OWNER_EMAIL },
    update: { tenantId: tenant.id, defaultBarbershopId: barbershop.id, passwordHash: ownerHash, role: "owner", active: true },
    create: {
      tenantId:           tenant.id,
      defaultBarbershopId: barbershop.id,
      email:        OWNER_EMAIL,
      passwordHash: ownerHash,
      name:         "Propietario",
      role:         "owner",
      active:       true,
    },
  });

  await prisma.barbershopMembership.upsert({
    where:  { userId_barbershopId: { userId: owner.id, barbershopId: barbershop.id } },
    update: { tenantId: tenant.id, role: "owner", active: true },
    create: { tenantId: tenant.id, barbershopId: barbershop.id, userId: owner.id, role: "owner", active: true },
  });

  console.log(`✅ Tenant: ${TENANT_NAME} (slug: ${TENANT_SLUG})`);
  console.log(`✅ Owner:  ${OWNER_EMAIL}`);
  console.log("\n─────────────────────────────────────────────");
  console.log("Accesos iniciales:");
  console.log(`  Superadmin → ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD}`);
  console.log(`  Owner      → ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log("─────────────────────────────────────────────");
  console.log("⚠️  Cambia las contraseñas tras el primer login.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());

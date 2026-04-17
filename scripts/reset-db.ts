// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · scripts/reset-db.ts
//
//  Limpia todos los datos operativos de la BD manteniendo el superadmin.
//  Uso: npx tsx scripts/reset-db.ts
//
//  ⚠️  DESTRUCTIVO — borra clients, appointments, payments, etc.
//      Confirma con "SI" en el prompt antes de ejecutar.
// ─────────────────────────────────────────────────────────────────────────────

import { createInterface } from "readline";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function confirm(msg: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${msg} (escribe SI para confirmar): `, (answer) => {
      rl.close();
      resolve(answer.trim() === "SI");
    });
  });
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   VANTTAGE · Reset de base de datos          ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // Contar registros actuales
  const [
    tenants, barbershops, barbers, services, clients,
    appointments, payments, notifications, history,
    schedules, categories, memberships, users,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.barbershop.count(),
    prisma.barber.count(),
    prisma.service.count(),
    prisma.client.count(),
    prisma.appointment.count(),
    prisma.payment.count(),
    prisma.notification.count(),
    prisma.appointmentHistory.count(),
    prisma.schedule.count(),
    prisma.serviceCategory.count(),
    prisma.barbershopMembership.count(),
    prisma.user.count(),
  ]);

  console.log("📊 Estado actual de la BD:");
  console.log(`   Tenants:      ${tenants}`);
  console.log(`   Barberías:    ${barbershops}`);
  console.log(`   Barberos:     ${barbers}`);
  console.log(`   Servicios:    ${services}`);
  console.log(`   Clientes:     ${clients}`);
  console.log(`   Citas:        ${appointments}`);
  console.log(`   Pagos:        ${payments}`);
  console.log(`   Notificac.:   ${notifications}`);
  console.log(`   Historial:    ${history}`);
  console.log(`   Horarios:     ${schedules}`);
  console.log(`   Categorías:   ${categories}`);
  console.log(`   Membresías:   ${memberships}`);
  console.log(`   Usuarios:     ${users}`);

  const superadmin = await prisma.user.findFirst({
    where: { role: "superadmin" },
    select: { email: true },
  });
  console.log(`\n🔐 Superadmin detectado: ${superadmin?.email ?? "ninguno"}`);
  console.log("   (el superadmin se CONSERVA, solo se borran datos operativos)\n");

  const ok = await confirm("⚠️  ¿Borrar TODOS los datos operativos?");
  if (!ok) {
    console.log("\n❌ Cancelado.");
    return;
  }

  console.log("\n🗑️  Limpiando en orden correcto (respetando FKs)...\n");

  // Orden: primero los hijos, luego los padres
  const steps: [string, () => Promise<{ count: number }>][] = [
    ["Notificaciones",       () => prisma.notification.deleteMany()],
    ["Historial de citas",   () => prisma.appointmentHistory.deleteMany()],
    ["Pagos",                () => prisma.payment.deleteMany()],
    ["Favoritos",            () => prisma.favoriteBarber.deleteMany()],
    ["Citas",                () => prisma.appointment.deleteMany()],
    ["Clientes",             () => prisma.client.deleteMany()],
    ["Password reset tokens",() => prisma.passwordResetToken.deleteMany()],
    ["Horarios",             () => prisma.schedule.deleteMany()],
    ["Barberos",             () => prisma.barber.deleteMany()],
    ["Servicios",            () => prisma.service.deleteMany()],
    ["Categorías",           () => prisma.serviceCategory.deleteMany()],
    ["Membresías",           () => prisma.barbershopMembership.deleteMany()],
    // Usuarios: borrar todo excepto superadmin
    ["Usuarios (no-super)",  () => prisma.user.deleteMany({ where: { role: { not: "superadmin" } } })],
    // Actualizar tenant a primaryBarbershopId = null antes de borrar barbershops
    ["Tenants (primaryBarbershop null)", () => prisma.tenant.updateMany({ data: { primaryBarbershopId: null } }).then(() => ({ count: 0 }))],
    ["Barberías",            () => prisma.barbershop.deleteMany()],
    ["Tenants",              () => prisma.tenant.deleteMany()],
  ];

  for (const [label, fn] of steps) {
    try {
      const { count } = await fn();
      if (count > 0) {
        console.log(`   ✅ ${label}: ${count} eliminados`);
      } else {
        console.log(`   ·  ${label}: vacío`);
      }
    } catch (err) {
      console.error(`   ❌ ${label}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log("\n✅ Base de datos limpia.");
  console.log(`🔐 Superadmin conservado: ${superadmin?.email ?? "ninguno"}`);
  console.log("\n👉 Siguiente paso: ejecutar 'npm run db:seed' para crear el tenant inicial\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

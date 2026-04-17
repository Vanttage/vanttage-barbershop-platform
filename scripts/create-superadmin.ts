/**
 * Crea o resetea el superadmin de VANTTAGE.
 * Uso:
 *   npm run db:superadmin
 *   SUPERADMIN_EMAIL=otro@email.com SUPERADMIN_PASSWORD=MiClave123 npm run db:superadmin
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL ?? "superadmin@vanttage.app";
  const password = process.env.SUPERADMIN_PASSWORD ?? "Vanttage2026*";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "superadmin",
      active: true,
      name: "VANTTAGE Admin",
    },
    create: {
      email,
      passwordHash,
      name: "VANTTAGE Admin",
      role: "superadmin",
      active: true,
    },
  });

  console.log("\n✓ Superadmin listo");
  console.log(`  Email   : ${user.email}`);
  console.log(`  Password: ${password}`);
  console.log(`  ID      : ${user.id}`);
  console.log("\n  → http://localhost:3000/login\n");
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

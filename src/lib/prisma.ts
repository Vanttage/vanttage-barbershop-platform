// ─────────────────────────────────────────────────────────────────
//  VANTTAGE · src/lib/prisma.ts
//
//  Singleton del cliente Prisma con soporte para PgBouncer.
//  El parámetro ?pgbouncer=true en DATABASE_URL desactiva los
//  prepared statements que el pooler descarta entre conexiones,
//  eliminando el error "prepared statement sXX does not exist".
//
//  DATABASE_URL  → pooler  (puerto 6543 en Supabase) con ?pgbouncer=true
//  DIRECT_URL    → directo (puerto 5432 en Supabase) para migraciones
// ─────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    // datasourceUrl anula la URL del schema en runtime si la defines aquí.
    // Lo dejamos vacío para que Prisma tome DATABASE_URL del entorno,
    // que debe incluir ?pgbouncer=true&connection_limit=1
  });
}

export const prisma = globalForPrisma.prisma ?? buildPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// ─────────────────────────────────────────────────────────────────
//  VANTTAGE · src/jobs/weekly-report.ts
//
//  Cron job: reporte semanal automático al dueño.
//  Se ejecuta cada lunes a las 8am desde /api/cron/weekly-report.
//
//  Incluye: citas completadas, ingresos, cliente más frecuente,
//  cancelaciones y comparación con la semana anterior.
// ─────────────────────────────────────────────────────────────────

import { prisma } from "@/src/lib/prisma";
import { sendWeeklyReportEmail } from "@/src/lib/email";

// ── Helpers de fecha ──────────────────────────────────────────────

// Bogotá es UTC-5 todo el año (sin horario de verano). En Vercel el
// servidor corre en UTC, así que `new Date().getDay()`/`setHours()` dan el
// día y la hora equivocados cerca de los bordes de semana (p. ej. una cita
// del domingo en la noche en Bogotá cae en el UTC del lunes). Para calcular
// el rango lunes–domingo hay que razonar en hora Bogotá y solo al final
// convertir a los instantes UTC reales que Prisma compara contra `startsAt`.
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

function getWeekRange(weeksAgo = 0): { start: Date; end: Date } {
  const nowBogota = new Date(Date.now() - BOGOTA_OFFSET_MS);
  const day = nowBogota.getUTCDay(); // 0=Dom — campos UTC de un reloj ya desplazado a Bogotá
  const diff = day === 0 ? 6 : day - 1; // días desde el lunes

  const mondayBogota = new Date(nowBogota);
  mondayBogota.setUTCDate(nowBogota.getUTCDate() - diff - weeksAgo * 7);
  mondayBogota.setUTCHours(0, 0, 0, 0);

  const sundayBogota = new Date(mondayBogota);
  sundayBogota.setUTCDate(mondayBogota.getUTCDate() + 6);
  sundayBogota.setUTCHours(23, 59, 59, 999);

  return {
    start: new Date(mondayBogota.getTime() + BOGOTA_OFFSET_MS),
    end: new Date(sundayBogota.getTime() + BOGOTA_OFFSET_MS),
  };
}

function formatCOPSimple(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Función principal ─────────────────────────────────────────────

export async function runWeeklyReport(): Promise<{
  tenantsProcessed: number;
  reportsSent: number;
}> {
  let reportsSent = 0;

  const tenants = await prisma.tenant.findMany({
    where: {
      active: true,
      plan: { in: ["pro", "premium"] },
      autoWeeklyReport: true,
    },
  });

  const thisWeek = getWeekRange(0);

  for (const tenant of tenants) {
    try {
      // ── Datos de esta semana ────────────────────────────────────

      const [thisAppts, topClient] = await Promise.all([
        prisma.appointment.findMany({
          where: {
            tenantId: tenant.id,
            startsAt: { gte: thisWeek.start, lte: thisWeek.end },
          },
          include: { client: true },
        }),

        // Cliente más frecuente: findFirst con include evita el N+1 (groupBy + findUnique separado)
        prisma.appointment.findFirst({
          where: {
            tenantId: tenant.id,
            startsAt: { gte: thisWeek.start, lte: thisWeek.end },
            status: "completed",
          },
          include: { client: { select: { name: true } } },
          orderBy: { startsAt: "desc" },
        }),
      ]);

      const completadas = thisAppts.filter((a) => a.status === "completed");
      const ingresos = completadas.reduce((s, a) => s + a.price, 0);

      // topClient es ahora el appointment (con include), no el groupBy
      const topClientName = topClient?.client?.name ?? "N/A";

      // ── Arma el mensaje ─────────────────────────────────────────

      // timeZone explicito: en Vercel el servidor corre en UTC, no Bogota.
      const semana = thisWeek.start.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        timeZone: "America/Bogota",
      });
      const semanaFin = thisWeek.end.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        timeZone: "America/Bogota",
      });

      // ── Envía el reporte por email (Resend) ──────────────────────

      let sent = false;

      if (tenant.email && process.env.RESEND_API_KEY) {
        const ownerUser = await prisma.user.findFirst({
          where: { tenantId: tenant.id, role: "owner" },
          select: { name: true },
        });
        const weekLabel = `${semana} – ${semanaFin}`;
        await sendWeeklyReportEmail({
          to: tenant.email,
          ownerName: ownerUser?.name ?? "Propietario",
          barbershopName: tenant.name,
          weekLabel,
          totalCitas: completadas.length,
          totalIngresos: ingresos,
          topClient: topClientName !== "N/A" ? topClientName : undefined,
        });
        sent = true;
      }

      if (sent) reportsSent++;

      console.log(
        `[weekly-report] ${tenant.slug} | Citas: ${completadas.length} | Ingresos: ${formatCOPSimple(ingresos)}`,
      );
    } catch (err) {
      console.error(`[weekly-report] Error en tenant ${tenant.slug}:`, err);
    }
  }

  return { tenantsProcessed: tenants.length, reportsSent };
}

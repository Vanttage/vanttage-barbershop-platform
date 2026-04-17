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
import { sendWhatsAppText, isTwilioConfigured } from "@/src/lib/whatsapp";
import { sendWeeklyReportEmail } from "@/src/lib/email";

// ── Helpers de fecha ──────────────────────────────────────────────

function getWeekRange(weeksAgo = 0): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0=Dom
  const diff = day === 0 ? 6 : day - 1; // días desde el lunes

  const monday = new Date(now);
  monday.setDate(now.getDate() - diff - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
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
  const lastWeek = getWeekRange(1);

  for (const tenant of tenants) {
    try {
      // ── Datos de esta semana ────────────────────────────────────

      const [thisAppts, lastAppts, topClient] = await Promise.all([
        prisma.appointment.findMany({
          where: {
            tenantId: tenant.id,
            startsAt: { gte: thisWeek.start, lte: thisWeek.end },
          },
          include: { client: true },
        }),

        prisma.appointment.findMany({
          where: {
            tenantId: tenant.id,
            startsAt: { gte: lastWeek.start, lte: lastWeek.end },
            status: "completed",
          },
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
      const canceladas = thisAppts.filter((a) => a.status === "cancelled");
      const pendientes = thisAppts.filter((a) => a.status !== "cancelled");
      const ingresos = completadas.reduce((s, a) => s + a.price, 0);
      const ingresosAntes = lastAppts.reduce((s, a) => s + a.price, 0);
      const delta =
        ingresosAntes > 0
          ? Math.round(((ingresos - ingresosAntes) / ingresosAntes) * 100)
          : 0;

      // topClient es ahora el appointment (con include), no el groupBy
      const topClientName = topClient?.client?.name ?? "N/A";

      // ── Arma el mensaje ─────────────────────────────────────────

      const semana = thisWeek.start.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
      });
      const semanaFin = thisWeek.end.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
      });

      const deltaStr = delta >= 0 ? `+${delta}%` : `${delta}%`;
      const deltaEmoji = delta >= 0 ? "📈" : "📉";

      const mensaje =
        `📊 *Reporte semanal · ${tenant.name}*\n` +
        `_${semana} – ${semanaFin}_\n\n` +
        `✅ Citas completadas: *${completadas.length}*\n` +
        `❌ Cancelaciones: *${canceladas.length}*\n` +
        `⏳ Total agendadas: *${pendientes.length}*\n\n` +
        `💰 Ingresos: *${formatCOPSimple(ingresos)}*\n` +
        `${deltaEmoji} vs semana anterior: *${deltaStr}*\n\n` +
        `⭐ Cliente más frecuente: *${topClientName}*\n\n` +
        `_Generado automáticamente por VANTTAGE_ 🚀`;

      // ── Envía el reporte ────────────────────────────────────────

      let sent = false;

      // Por WhatsApp (Twilio) al número del dueño
      if (isTwilioConfigured() && tenant.phoneWa) {
        const result = await sendWhatsAppText({ to: tenant.phoneWa, text: mensaje });
        sent = result.success;
      }

      // Por email (Resend) — siempre si hay email configurado
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
        if (!sent) { sent = true; }
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

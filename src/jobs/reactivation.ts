// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · src/jobs/reactivation.ts
//
//  Cron job: reactivación de clientes inactivos (Telegram).
//  Se ejecuta cada lunes a las 10am desde /api/cron/reactivation.
//
//  Lógica:
//  - Solo para tenants Pro/Premium con autoReactivacion activo
//  - Busca clientes con Telegram vinculado sin cita en los últimos 30 días
//  - Envía mensaje de "te echamos de menos" con descuento del 10%
//  - Máximo 100 mensajes por tenant por semana
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/src/lib/prisma";
import {
  sendTelegramMessage,
  isTelegramConfigured,
  buildTelegramReactivationMessage,
} from "@/src/lib/telegram";

export async function runReactivation(): Promise<{
  tenantsProcessed: number;
  messagesSent: number;
  messagesFailed: number;
}> {
  let messagesSent   = 0;
  let messagesFailed = 0;

  if (!isTelegramConfigured()) {
    console.warn("[reactivation] Telegram no configurado — saltando ejecución.");
    return { tenantsProcessed: 0, messagesSent: 0, messagesFailed: 0 };
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  const tenants = await prisma.tenant.findMany({
    where: {
      active: true,
      plan: { in: ["pro", "premium"] },
      autoReactivacion: true,
      telegramEnabled: true,
    },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000);

  for (const tenant of tenants) {
    const inactiveClients = await prisma.client.findMany({
      where: {
        tenantId: tenant.id,
        active: true,
        telegramChatId: { not: null },
        lastVisitAt: { lt: thirtyDaysAgo },
      },
      take: 100, // límite semanal por tenant
    });

    console.log(
      `[reactivation] Tenant: ${tenant.slug} | Inactivos con Telegram: ${inactiveClients.length}`,
    );

    for (const client of inactiveClients) {
      const text = buildTelegramReactivationMessage({
        clientName: client.name,
        tenantName: tenant.name,
        bookingUrl: `${appUrl}/${tenant.slug}/reservar`,
        discountPct: 10,
      });

      const result = await sendTelegramMessage({ chatId: client.telegramChatId!, text });

      if (result.success) {
        messagesSent++;
      } else {
        messagesFailed++;
        console.error(
          `[reactivation] Falló para cliente ${client.id}:`,
          result.error,
        );
      }
    }
  }

  console.log(
    `[reactivation] Enviados: ${messagesSent} | Fallidos: ${messagesFailed}`,
  );

  return { tenantsProcessed: tenants.length, messagesSent, messagesFailed };
}

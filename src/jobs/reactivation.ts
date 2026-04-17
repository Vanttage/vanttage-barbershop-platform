// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · src/jobs/reactivation.ts
//
//  Cron job: reactivación de clientes inactivos (Twilio WhatsApp).
//  Se ejecuta cada lunes a las 10am desde /api/cron/reactivation.
//
//  Lógica:
//  - Solo para tenants Pro/Premium con autoReactivacion activo
//  - Busca clientes sin cita en los últimos 30 días
//  - Envía mensaje de "te echamos de menos" con descuento del 10%
//  - Máximo 100 mensajes por tenant por semana
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/src/lib/prisma";
import {
  sendWhatsAppText,
  isTwilioConfigured,
  buildReactivationMessage,
} from "@/src/lib/whatsapp";

export async function runReactivation(): Promise<{
  tenantsProcessed: number;
  messagesSent: number;
  messagesFailed: number;
}> {
  let messagesSent   = 0;
  let messagesFailed = 0;

  if (!isTwilioConfigured()) {
    console.warn("[reactivation] Twilio no configurado — saltando ejecución.");
    return { tenantsProcessed: 0, messagesSent: 0, messagesFailed: 0 };
  }

  const tenants = await prisma.tenant.findMany({
    where: {
      active: true,
      plan: { in: ["pro", "premium"] },
      autoReactivacion: true,
    },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000);

  for (const tenant of tenants) {
    const inactiveClients = await prisma.client.findMany({
      where: {
        tenantId: tenant.id,
        active: true,
        phone: { not: "" },
        lastVisitAt: { lt: thirtyDaysAgo },
      },
      take: 100, // límite semanal por tenant
    });

    console.log(
      `[reactivation] Tenant: ${tenant.slug} | Inactivos: ${inactiveClients.length}`,
    );

    for (const client of inactiveClients) {
      const text = buildReactivationMessage({
        clientName:  client.name,
        tenantName:  tenant.name,
        tenantSlug:  tenant.slug,
        discountPct: 10,
      });

      const result = await sendWhatsAppText({ to: client.phone, text });

      if (result.success) {
        messagesSent++;
      } else {
        messagesFailed++;
        console.error(
          `[reactivation] Falló para ${client.phone}:`,
          result.error,
        );
      }

      // 300ms entre mensajes para respetar el rate limit de Twilio
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(
    `[reactivation] Enviados: ${messagesSent} | Fallidos: ${messagesFailed}`,
  );

  return { tenantsProcessed: tenants.length, messagesSent, messagesFailed };
}

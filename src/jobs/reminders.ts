// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · src/jobs/reminders.ts
//
//  Cron job: recordatorios automáticos por Telegram.
//  Se ejecuta cada hora desde /api/cron/reminders (Vercel Cron).
//
//  Lógica:
//  - Busca citas que empiezan en las próximas 24h ± 30min → recordatorio 24h
//  - Busca citas que empiezan en la próxima 1h ± 15min   → recordatorio 1h
//  - Busca citas completadas hace 1.5–2.5h sin reseña    → solicitud reseña
//  Solo envía si el tenant tiene el toggle correspondiente activo Y el
//  cliente vinculó su Telegram — si no lo vinculó, simplemente no recibe
//  nada por este canal (no hay fallback).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/src/lib/prisma";
import {
  sendTelegramMessage,
  isTelegramConfigured,
  buildTelegramReminder24hMessage,
  buildTelegramReminder1hMessage,
  buildTelegramReviewRequestMessage,
} from "@/src/lib/telegram";

interface ReminderResult {
  appointmentId: string;
  type: "24h" | "1h" | "review";
  success: boolean;
  error?: string;
}

export async function runReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  results: ReminderResult[];
}> {
  const results: ReminderResult[] = [];

  if (!isTelegramConfigured()) {
    console.warn("[reminders] Telegram no configurado — saltando ejecución.");
    return { processed: 0, sent: 0, failed: 0, results };
  }

  const now = new Date();

  // ── Recordatorio 24h ──────────────────────────────────────────────────────
  // Ventana: citas que empiezan entre 23.5h y 24.5h desde ahora

  const h24Start = new Date(now.getTime() + 23.5 * 60 * 60_000);
  const h24End   = new Date(now.getTime() + 24.5 * 60 * 60_000);

  const appts24h = await prisma.appointment.findMany({
    where: {
      status: { in: ["pending", "confirmed"] },
      reminder24hSentAt: null,
      startsAt: { gte: h24Start, lte: h24End },
      tenant: { autoReminder24h: true, telegramEnabled: true },
      client: { telegramChatId: { not: null } },
    },
    include: {
      tenant: { select: { name: true } },
      barber: { select: { name: true } },
      service: { select: { name: true } },
      client: { select: { name: true, telegramChatId: true } },
    },
  });

  for (const appt of appts24h) {
    const text = buildTelegramReminder24hMessage({
      clientName:  appt.client.name,
      barberName:  appt.barber.name,
      serviceName: appt.service.name,
      startsAt:    appt.startsAt,
      tenantName:  appt.tenant.name,
    });
    const result = await sendTelegramMessage({ chatId: appt.client.telegramChatId!, text });
    results.push({ appointmentId: appt.id, type: "24h", ...result });

    if (result.success) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminder24hSentAt: new Date() },
      });
    }
  }

  // ── Recordatorio 1h ───────────────────────────────────────────────────────
  // Ventana: citas que empiezan entre 45min y 75min desde ahora

  const h1Start = new Date(now.getTime() + 45 * 60_000);
  const h1End   = new Date(now.getTime() + 75 * 60_000);

  const appts1h = await prisma.appointment.findMany({
    where: {
      status: { in: ["pending", "confirmed"] },
      reminder1hSentAt: null,
      startsAt: { gte: h1Start, lte: h1End },
      tenant: { autoReminder1h: true, telegramEnabled: true },
      client: { telegramChatId: { not: null } },
    },
    include: {
      tenant: { select: { name: true, address: true } },
      barber: { select: { name: true } },
      client: { select: { name: true, telegramChatId: true } },
    },
  });

  for (const appt of appts1h) {
    const text = buildTelegramReminder1hMessage({
      clientName: appt.client.name,
      barberName: appt.barber.name,
      startsAt:   appt.startsAt,
      tenantName: appt.tenant.name,
      address:    appt.tenant.address ?? undefined,
    });
    const result = await sendTelegramMessage({ chatId: appt.client.telegramChatId!, text });
    results.push({ appointmentId: appt.id, type: "1h", ...result });

    if (result.success) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminder1hSentAt: new Date() },
      });
    }
  }

  // ── Solicitud de reseña ───────────────────────────────────────────────────
  // Citas completadas hace entre 1.5h y 2.5h, sin reseña solicitada

  const reviewStart = new Date(now.getTime() - 2.5 * 60 * 60_000);
  const reviewEnd   = new Date(now.getTime() - 1.5 * 60 * 60_000);

  const apptsReview = await prisma.appointment.findMany({
    where: {
      status: "completed",
      reviewRequestSentAt: null,
      endsAt: { gte: reviewStart, lte: reviewEnd },
      tenant: { autoReviewRequest: true, telegramEnabled: true },
      client: { telegramChatId: { not: null } },
    },
    include: {
      tenant: { select: { name: true, googlePlaceId: true } },
      client: { select: { name: true, telegramChatId: true } },
    },
  });

  for (const appt of apptsReview) {
    if (!appt.tenant.googlePlaceId) continue;

    const text = buildTelegramReviewRequestMessage({
      clientName:    appt.client.name,
      tenantName:    appt.tenant.name,
      googlePlaceId: appt.tenant.googlePlaceId,
    });

    const result = await sendTelegramMessage({ chatId: appt.client.telegramChatId!, text });
    results.push({ appointmentId: appt.id, type: "review", ...result });

    if (result.success) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reviewRequestSentAt: new Date() },
      });
    }
  }

  const sent   = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(
    `[reminders] Procesados: ${results.length} | Enviados: ${sent} | Fallidos: ${failed}`,
  );

  return { processed: results.length, sent, failed, results };
}

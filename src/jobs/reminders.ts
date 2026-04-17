// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · src/jobs/reminders.ts
//
//  Cron job: recordatorios automáticos por WhatsApp (Twilio).
//  Se ejecuta cada hora desde /api/cron/reminders (Vercel Cron).
//
//  Lógica:
//  - Busca citas que empiezan en las próximas 24h ± 30min → recordatorio 24h
//  - Busca citas que empiezan en la próxima 1h ± 15min   → recordatorio 1h
//  - Busca citas completadas hace 1.5–2.5h sin reseña    → solicitud reseña
//  Solo envía si el tenant tiene el toggle correspondiente activo.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/src/lib/prisma";
import {
  sendWhatsAppText,
  isTwilioConfigured,
  buildReminder24hMessage,
  buildReminder1hMessage,
  buildReviewRequestMessage,
} from "@/src/lib/whatsapp";

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

  if (!isTwilioConfigured()) {
    console.warn("[reminders] Twilio no configurado — saltando ejecución.");
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
      tenant: { autoReminder24h: true },
    },
    include: {
      tenant: true,
      barber: true,
      client: true,
      service: true,
    },
  });

  for (const appt of appts24h) {
    if (!appt.client.phone) continue;

    const text = buildReminder24hMessage({
      clientName:  appt.client.name,
      barberName:  appt.barber.name,
      serviceName: appt.service.name,
      startsAt:    appt.startsAt,
      tenantName:  appt.tenant.name,
    });

    const result = await sendWhatsAppText({ to: appt.client.phone, text });
    results.push({ appointmentId: appt.id, type: "24h", ...result });

    if (result.success) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminder24hSentAt: new Date() },
      });
    }

    // Pausa entre envíos para respetar el rate limit de Twilio
    await new Promise((r) => setTimeout(r, 120));
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
      tenant: { autoReminder1h: true },
    },
    include: {
      tenant: { select: { id: true, name: true, address: true, autoReminder1h: true } },
      barber: { select: { name: true } },
      client: { select: { name: true, phone: true } },
    },
  });

  for (const appt of appts1h) {
    if (!appt.client.phone) continue;

    const text = buildReminder1hMessage({
      clientName: appt.client.name,
      barberName: appt.barber.name,
      startsAt:   appt.startsAt,
      tenantName: appt.tenant.name,
      address:    appt.tenant.address ?? undefined,
    });

    const result = await sendWhatsAppText({ to: appt.client.phone, text });
    results.push({ appointmentId: appt.id, type: "1h", ...result });

    if (result.success) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminder1hSentAt: new Date() },
      });
    }

    await new Promise((r) => setTimeout(r, 120));
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
      tenant: { autoReviewRequest: true },
    },
    include: {
      tenant: { select: { id: true, name: true, googlePlaceId: true } },
      client: { select: { name: true, phone: true } },
    },
  });

  for (const appt of apptsReview) {
    if (!appt.client.phone || !appt.tenant.googlePlaceId) continue;

    const text = buildReviewRequestMessage({
      clientName:    appt.client.name,
      tenantName:    appt.tenant.name,
      googlePlaceId: appt.tenant.googlePlaceId,
    });

    const result = await sendWhatsAppText({ to: appt.client.phone, text });
    results.push({ appointmentId: appt.id, type: "review", ...result });

    if (result.success) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reviewRequestSentAt: new Date() },
      });
    }

    await new Promise((r) => setTimeout(r, 120));
  }

  const sent   = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(
    `[reminders] Procesados: ${results.length} | Enviados: ${sent} | Fallidos: ${failed}`,
  );

  return { processed: results.length, sent, failed, results };
}

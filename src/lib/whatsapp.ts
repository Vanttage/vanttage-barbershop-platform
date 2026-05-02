// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · src/lib/whatsapp.ts
//
//  Wrapper para Twilio WhatsApp API.
//  Credenciales globales — un solo número de VANTTAGE envía en nombre
//  de cada barbería. Los mensajes incluyen el nombre del negocio.
//
//  Variables de entorno requeridas:
//    TWILIO_ACCOUNT_SID   — Account SID de Twilio
//    TWILIO_AUTH_TOKEN    — Auth Token de Twilio
//    TWILIO_WA_FROM       — Número emisor en formato E.164: +14155238886
//                           (sandbox) o el número aprobado de producción
//
//  Docs: https://www.twilio.com/docs/whatsapp/api
// ─────────────────────────────────────────────────────────────────────────────

import twilio from "twilio";

// ── Cliente Twilio (singleton) ────────────────────────────────────────────────

function getTwilioClient() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error(
      "[Twilio] TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN son requeridos.",
    );
  }
  return twilio(sid, token);
}

const WA_FROM = () => {
  const from = process.env.TWILIO_WA_FROM;
  if (!from) throw new Error("[Twilio] TWILIO_WA_FROM no está configurado.");
  // Acepta "+14155238886" o "whatsapp:+14155238886"
  return from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
};

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface WaSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ── Normaliza número colombiano ───────────────────────────────────────────────
// Entrada:  3001234567 | +573001234567 | 573001234567
// Salida:   +573001234567  (E.164 completo con +)

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("3"))  return `+57${digits}`;
  // Si ya trae código de país genérico
  if (digits.length > 10) return `+${digits}`;
  return `+57${digits}`;
}

/** @deprecated Usa normalizePhone — mantenido por compatibilidad */
export const normalizeColombianPhone = normalizePhone;

// ── Verificar si Twilio está configurado ──────────────────────────────────────

export function isTwilioConfigured(): boolean {
  return (
    Boolean(process.env.TWILIO_ACCOUNT_SID) &&
    Boolean(process.env.TWILIO_AUTH_TOKEN) &&
    Boolean(process.env.TWILIO_WA_FROM)
  );
}

// ── Enviar mensaje de texto libre ─────────────────────────────────────────────

export async function sendWhatsAppText({
  to,
  text,
}: {
  to: string;
  text: string;
}): Promise<WaSendResult> {
  if (!isTwilioConfigured()) {
    console.warn("[Twilio] Credenciales no configuradas — mensaje omitido.");
    return { success: false, error: "Twilio no configurado" };
  }

  try {
    const client  = getTwilioClient();
    const message = await client.messages.create({
      from: WA_FROM(),
      to:   `whatsapp:${normalizePhone(to)}`,
      body: text,
    });

    console.log(`[Twilio] Enviado → ${to} | SID: ${message.sid}`);
    return { success: true, messageId: message.sid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Twilio] Error enviando mensaje:", msg);
    return { success: false, error: msg };
  }
}

// ── Mensajes predefinidos VANTTAGE ────────────────────────────────────────────

export function buildConfirmationMessage(params: {
  clientName: string;
  barberName: string;
  serviceName: string;
  startsAt: Date | string;
  tenantName: string;
  address?: string;
  appointmentUrl?: string;
}): string {
  const d = new Date(params.startsAt);
  const fecha = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  const hora = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return (
    `✅ *¡Cita confirmada!*\n\n` +
    `Hola ${params.clientName}, tu cita está lista:\n\n` +
    `💈 *Servicio:* ${params.serviceName}\n` +
    `👤 *Barbero:* ${params.barberName}\n` +
    `📅 *Fecha:* ${fecha}\n` +
    `🕐 *Hora:* ${hora}\n` +
    `📍 *Lugar:* ${params.tenantName}${params.address ? ` · ${params.address}` : ""}` +
    (params.appointmentUrl ? `\n\n🔗 *Ver o gestionar tu cita:*\n${params.appointmentUrl}` : "") +
    `\n\n_¿Necesitas cancelar o reagendar? Usa el enlace de arriba._`
  );
}

export function buildReminder24hMessage(params: {
  clientName: string;
  barberName: string;
  serviceName: string;
  startsAt: Date | string;
  tenantName: string;
}): string {
  const hora = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(params.startsAt));

  return (
    `⏰ *Recordatorio de cita — ${params.tenantName}*\n\n` +
    `Hola ${params.clientName}! Mañana tienes cita:\n\n` +
    `💈 ${params.serviceName} con ${params.barberName}\n` +
    `🕐 ${hora}\n\n` +
    `Responde *SI* para confirmar o *NO* para cancelar.`
  );
}

export function buildReminder1hMessage(params: {
  clientName: string;
  barberName: string;
  startsAt: Date | string;
  tenantName: string;
  address?: string;
}): string {
  const hora = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(params.startsAt));

  return (
    `🔔 *¡En 1 hora tu cita!*\n\n` +
    `${params.clientName}, te esperamos a las *${hora}* con ${params.barberName} ` +
    `en *${params.tenantName}*` +
    `${params.address ? `\n📍 ${params.address}` : ""}` +
    `\n\n_¡Nos vemos pronto!_`
  );
}

export function buildReviewRequestMessage(params: {
  clientName: string;
  tenantName: string;
  reviewToken: string;
  baseUrl?: string;
}): string {
  const base = params.baseUrl ?? process.env.NEXTAUTH_URL ?? "https://vanttage.app";
  const reviewUrl = `${base}/resena/${params.reviewToken}`;
  return (
    `⭐ *¡Gracias por visitarnos, ${params.clientName}!*\n\n` +
    `¿Cómo estuvo tu experiencia en *${params.tenantName}*? Tu opinión nos ayuda mucho 🙏\n\n` +
    `Déjanos tu calificación aquí 👇\n${reviewUrl}\n\n` +
    `_Solo tarda 30 segundos. ¡Gracias!_`
  );
}

export function buildNewBookingAdminMessage(params: {
  clientName: string;
  clientPhone: string;
  barberName: string;
  serviceName: string;
  startsAt: Date | string;
  tenantName: string;
  appointmentUrl?: string;
}): string {
  const d = new Date(params.startsAt);
  const fecha = new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
  const hora = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return (
    `📅 *Nueva reserva — ${params.tenantName}*\n\n` +
    `👤 *Cliente:* ${params.clientName}\n` +
    `📱 *Teléfono:* ${normalizePhone(params.clientPhone)}\n` +
    `💈 *Servicio:* ${params.serviceName}\n` +
    `✂️ *Barbero:* ${params.barberName}\n` +
    `🗓 *Fecha:* ${fecha} · ${hora}` +
    (params.appointmentUrl ? `\n\n🔗 ${params.appointmentUrl}` : "")
  );
}

export function buildReactivationMessage(params: {
  clientName: string;
  tenantName: string;
  tenantSlug: string;
  discountPct?: number;
}): string {
  const bookingUrl = `https://${params.tenantSlug}.vanttage.app`;
  const discount   = params.discountPct ?? 10;
  return (
    `💈 *¡Te echamos de menos, ${params.clientName}!*\n\n` +
    `Hace un tiempo que no te vemos en *${params.tenantName}*. ` +
    `Esta semana tienes un *${discount}% de descuento* en tu próxima visita.\n\n` +
    `Reserva tu cita 👇\n${bookingUrl}\n\n` +
    `_Descuento válido esta semana. Menciona este mensaje al llegar._`
  );
}

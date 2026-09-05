// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · src/lib/telegram.ts
//
//  Wrapper para la Telegram Bot API. Un solo bot de NAVA notifica a los
//  clientes de todas las barberías — cada Client vincula su chat de Telegram
//  una sola vez (ver /api/telegram/webhook) y a partir de ahí recibe
//  confirmaciones, recordatorios, cambios y cancelaciones de sus citas.
//
//  Variables de entorno requeridas:
//    TELEGRAM_BOT_TOKEN      — token que da @BotFather al crear el bot
//    TELEGRAM_WEBHOOK_SECRET — string aleatorio propio (no lo da Telegram);
//                              se registra al configurar el webhook y se
//                              valida en cada request entrante para
//                              confirmar que viene de Telegram y no de un
//                              tercero que adivinó la URL del webhook.
//    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME — username del bot (sin @), público,
//                              usado por el frontend para construir el link
//                              https://t.me/<username>?start=<token>
//
//  Docs: https://core.telegram.org/bots/api
// ─────────────────────────────────────────────────────────────────────────────

import crypto from "crypto";

const TELEGRAM_API = "https://api.telegram.org";

export interface TgSendResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

/** Token de un solo uso para vincular un Client con un chat de Telegram. */
export function generateTelegramLinkToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export const TELEGRAM_LINK_TOKEN_TTL_MS = 15 * 60_000;

interface InlineButton {
  text: string;
  url: string;
}

/** Envía un mensaje de texto (HTML) con botones URL opcionales (una fila por botón). */
export async function sendTelegramMessage({
  chatId,
  text,
  buttons,
}: {
  chatId: string;
  text: string;
  buttons?: InlineButton[];
}): Promise<TgSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN no configurado — mensaje omitido.");
    return { success: false, error: "Telegram no configurado" };
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(buttons?.length
          ? {
              reply_markup: {
                inline_keyboard: buttons.map((b) => [{ text: b.text, url: b.url }]),
              },
            }
          : {}),
      }),
    });

    const json = await res.json();
    if (!json.ok) {
      console.error("[Telegram] Error enviando mensaje:", json.description);
      return { success: false, error: json.description ?? "Error desconocido" };
    }

    return { success: true, messageId: json.result.message_id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Telegram] Error de red enviando mensaje:", msg);
    return { success: false, error: msg };
  }
}

// ── Mensajes predefinidos NAVA ────────────────────────────────────────────────

function formatFechaHora(startsAt: Date | string) {
  const d = new Date(startsAt);
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
  return { fecha, hora };
}

export function buildTelegramWelcomeMessage(tenantName: string): string {
  return (
    `✅ <b>¡Cuenta vinculada!</b>\n\n` +
    `Ya puedes recibir por aquí tus recordatorios de <b>${tenantName}</b>: ` +
    `confirmaciones, avisos 24h y 1h antes de tu cita, y cambios si algo se mueve.`
  );
}

export function buildTelegramConfirmationMessage(params: {
  clientName: string;
  barberName: string;
  serviceName: string;
  startsAt: Date | string;
  tenantName: string;
  address?: string;
}): string {
  const { fecha, hora } = formatFechaHora(params.startsAt);
  return (
    `✂️ <b>Reserva confirmada</b>\n\n` +
    `Hola ${params.clientName}, tu cita en <b>${params.tenantName}</b> quedó lista:\n\n` +
    `💈 Servicio: ${params.serviceName}\n` +
    `👤 Barbero: ${params.barberName}\n` +
    `📅 Fecha: ${fecha}\n` +
    `🕐 Hora: ${hora}` +
    `${params.address ? `\n📍 ${params.address}` : ""}`
  );
}

export function buildTelegramReminder24hMessage(params: {
  clientName: string;
  barberName: string;
  serviceName: string;
  startsAt: Date | string;
  tenantName: string;
}): string {
  const { hora } = formatFechaHora(params.startsAt);
  return (
    `⏰ <b>Recordatorio de tu cita</b>\n\n` +
    `Mañana tienes una cita en <b>${params.tenantName}</b>.\n\n` +
    `✂️ ${params.serviceName}\n` +
    `🕐 ${hora}\n` +
    `👤 ${params.barberName}`
  );
}

export function buildTelegramReminder1hMessage(params: {
  clientName: string;
  barberName: string;
  startsAt: Date | string;
  tenantName: string;
  address?: string;
}): string {
  const { hora } = formatFechaHora(params.startsAt);
  return (
    `🔔 <b>Tu cita es en 1 hora</b>\n\n` +
    `Te esperamos a las <b>${hora}</b> con ${params.barberName} en <b>${params.tenantName}</b>. ✂️` +
    `${params.address ? `\n📍 ${params.address}` : ""}`
  );
}

export function buildTelegramRescheduledMessage(params: {
  clientName: string;
  barberName: string;
  serviceName: string;
  startsAt: Date | string;
  tenantName: string;
}): string {
  const { fecha, hora } = formatFechaHora(params.startsAt);
  return (
    `🔄 <b>Tu cita fue reprogramada</b>\n\n` +
    `Nueva fecha en <b>${params.tenantName}</b>:\n\n` +
    `📅 ${fecha}\n` +
    `🕐 ${hora}\n` +
    `👤 ${params.barberName} · ✂️ ${params.serviceName}`
  );
}

export function buildTelegramCancelledMessage(params: {
  clientName: string;
  startsAt: Date | string;
  tenantName: string;
}): string {
  const { fecha, hora } = formatFechaHora(params.startsAt);
  return (
    `⚠️ <b>Tu cita fue cancelada</b>\n\n` +
    `Tu cita en <b>${params.tenantName}</b> del ${fecha} a las ${hora} fue cancelada.`
  );
}

export function buildTelegramCompletedMessage(params: {
  clientName: string;
  tenantName: string;
}): string {
  return (
    `🙌 <b>¡Gracias por tu visita, ${params.clientName}!</b>\n\n` +
    `Esperamos que hayas quedado satisfecho en <b>${params.tenantName}</b>. ¡Te esperamos pronto!`
  );
}

export function buildTelegramReviewRequestMessage(params: {
  clientName: string;
  tenantName: string;
  googlePlaceId: string;
}): string {
  const reviewUrl = `https://search.google.com/local/writereview?placeid=${params.googlePlaceId}`;
  return (
    `⭐ <b>¡Gracias por visitarnos, ${params.clientName}!</b>\n\n` +
    `¿Cómo te fue en <b>${params.tenantName}</b>? Tu opinión nos ayuda mucho 🙏\n\n` +
    `Déjanos una reseña aquí 👇\n${reviewUrl}`
  );
}

export function buildTelegramReactivationMessage(params: {
  clientName: string;
  tenantName: string;
  bookingUrl: string;
  discountPct?: number;
}): string {
  const discount = params.discountPct ?? 10;
  return (
    `💈 <b>¡Te echamos de menos, ${params.clientName}!</b>\n\n` +
    `Hace un tiempo que no te vemos en <b>${params.tenantName}</b>. ` +
    `Esta semana tienes un <b>${discount}% de descuento</b> en tu próxima visita.\n\n` +
    `Reserva tu cita 👇\n${params.bookingUrl}`
  );
}

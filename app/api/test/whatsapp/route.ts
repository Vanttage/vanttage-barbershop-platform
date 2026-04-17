// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · app/api/test/whatsapp/route.ts
//
//  Endpoint de prueba — envía un mensaje WhatsApp real via Twilio.
//  Solo disponible en NODE_ENV !== "production" O con CRON_SECRET correcto.
//
//  GET  /api/test/whatsapp?to=3001234567
//  POST /api/test/whatsapp  { "to": "3001234567", "message": "..." }
//
//  Headers requeridos: Authorization: Bearer <CRON_SECRET>
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import {
  sendWhatsAppText,
  isTwilioConfigured,
  normalizePhone,
  buildConfirmationMessage,
  buildReminder24hMessage,
  buildReminder1hMessage,
  buildReviewRequestMessage,
  buildReactivationMessage,
} from "@/src/lib/whatsapp";

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const to   = searchParams.get("to")   ?? "";
  const type = searchParams.get("type") ?? "simple";

  if (!to) {
    return NextResponse.json(
      { error: "Parámetro 'to' requerido (ej: ?to=3001234567)" },
      { status: 400 },
    );
  }

  // ── Estado de configuración ───────────────────────────────────────────────

  const config = {
    twilio_configured: isTwilioConfigured(),
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID
      ? `${process.env.TWILIO_ACCOUNT_SID.slice(0, 8)}...`
      : "❌ no configurado",
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN
      ? `${process.env.TWILIO_AUTH_TOKEN.slice(0, 6)}...`
      : "❌ no configurado",
    TWILIO_WA_FROM: process.env.TWILIO_WA_FROM ?? "❌ no configurado",
    normalized_to: normalizePhone(to),
  };

  if (!isTwilioConfigured()) {
    return NextResponse.json({ ok: false, config, error: "Twilio no está configurado" }, { status: 503 });
  }

  // ── Selecciona el tipo de mensaje a enviar ────────────────────────────────

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60_000);
  const in1h  = new Date(now.getTime() + 60 * 60_000);

  let text: string;

  switch (type) {
    case "confirmation":
      text = buildConfirmationMessage({
        clientName:  "Carlos Test",
        barberName:  "Juan Pérez",
        serviceName: "Corte + barba",
        startsAt:    in24h,
        tenantName:  "Barbería VANTTAGE",
        address:     "Calle 72 #10-07, Bogotá",
      });
      break;
    case "reminder24h":
      text = buildReminder24hMessage({
        clientName:  "Carlos Test",
        barberName:  "Juan Pérez",
        serviceName: "Corte clásico",
        startsAt:    in24h,
        tenantName:  "Barbería VANTTAGE",
      });
      break;
    case "reminder1h":
      text = buildReminder1hMessage({
        clientName: "Carlos Test",
        barberName: "Juan Pérez",
        startsAt:   in1h,
        tenantName: "Barbería VANTTAGE",
        address:    "Calle 72 #10-07, Bogotá",
      });
      break;
    case "review":
      text = buildReviewRequestMessage({
        clientName:    "Carlos Test",
        tenantName:    "Barbería VANTTAGE",
        googlePlaceId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
      });
      break;
    case "reactivation":
      text = buildReactivationMessage({
        clientName:  "Carlos Test",
        tenantName:  "Barbería VANTTAGE",
        tenantSlug:  "rey",
        discountPct: 10,
      });
      break;
    default:
      text =
        `🚀 *VANTTAGE — Mensaje de prueba*\n\n` +
        `✅ Twilio está funcionando correctamente.\n` +
        `📱 Enviado a: ${normalizePhone(to)}\n` +
        `🕐 ${now.toLocaleString("es-CO")}\n\n` +
        `_Este es un mensaje de prueba del sistema de automatizaciones._`;
  }

  // ── Envía ─────────────────────────────────────────────────────────────────

  const result = await sendWhatsAppText({ to, text });

  return NextResponse.json({
    ok:     result.success,
    type,
    to:     normalizePhone(to),
    result,
    config,
    preview: text,
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { to, message } = body as { to?: string; message?: string };

  if (!to || !message) {
    return NextResponse.json(
      { error: "Body requerido: { to, message }" },
      { status: 400 },
    );
  }

  if (!isTwilioConfigured()) {
    return NextResponse.json({ ok: false, error: "Twilio no está configurado" }, { status: 503 });
  }

  const result = await sendWhatsAppText({ to, text: message });

  return NextResponse.json({
    ok:   result.success,
    to:   normalizePhone(to),
    result,
  });
}

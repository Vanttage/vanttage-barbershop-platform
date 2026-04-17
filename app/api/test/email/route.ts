// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · app/api/test/email/route.ts
//
//  Endpoint de prueba — envía emails reales via Resend.
//  Headers requeridos: Authorization: Bearer <CRON_SECRET>
//
//  GET  /api/test/email?to=user@example.com&type=reset|changed|weekly
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWeeklyReportEmail,
} from "@/src/lib/email";

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const to   = searchParams.get("to")   ?? "";
  const type = searchParams.get("type") ?? "reset";

  if (!to) {
    return NextResponse.json(
      { error: "Parámetro 'to' requerido (ej: ?to=tu@email.com)" },
      { status: 400 },
    );
  }

  const config = {
    resend_configured: Boolean(process.env.RESEND_API_KEY),
    RESEND_API_KEY: process.env.RESEND_API_KEY
      ? `re_...${process.env.RESEND_API_KEY.slice(-6)}`
      : "❌ no configurado",
    RESEND_FROM: process.env.RESEND_FROM ?? "❌ no configurado",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  };

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, config, error: "RESEND_API_KEY no configurado" }, { status: 503 });
  }

  let result: { ok: boolean; error?: string };

  switch (type) {
    case "changed":
      result = await sendPasswordChangedEmail({ to, name: "Usuario Test" });
      break;

    case "weekly":
      result = await sendWeeklyReportEmail({
        to,
        ownerName:     "Propietario Test",
        barbershopName: "Barbería VANTTAGE Demo",
        weekLabel:     "14 abr – 20 abr",
        totalCitas:    42,
        totalIngresos: 1_850_000,
        topClient:     "Carlos García",
      });
      break;

    case "reset":
    default:
      result = await sendPasswordResetEmail({
        to,
        name:  "Usuario Test",
        token: "test-token-abc123-no-es-valido",
      });
  }

  return NextResponse.json({
    ok:     result.ok,
    type,
    to,
    result,
    config,
  });
}

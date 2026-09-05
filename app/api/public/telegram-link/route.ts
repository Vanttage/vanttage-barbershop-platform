import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/src/lib/rateLimit";
import {
  TELEGRAM_LINK_TOKEN_TTL_MS,
  generateTelegramLinkToken,
  isTelegramConfigured,
} from "@/src/lib/telegram";

/**
 * Genera el token de un solo uso para el botón "Recibir por Telegram" de la
 * pantalla de confirmación en /reservar. El cliente abre
 * https://t.me/<bot>?start=<token> y el webhook (POST /api/telegram/webhook)
 * usa ese token para saber a qué Client vincular el chat.
 */
export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, { limit: 10, windowMs: 60_000, prefix: "telegram-link" });
  if (!rl.ok) return rateLimitResponse(rl);

  if (!isTelegramConfigured() || !process.env.TELEGRAM_BOT_USERNAME) {
    return NextResponse.json({ error: "Telegram no está disponible" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const clientId = typeof body?.clientId === "string" ? body.clientId : null;
  if (!clientId) {
    return NextResponse.json({ error: "clientId es obligatorio" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const token = generateTelegramLinkToken();
  await prisma.client.update({
    where: { id: clientId },
    data: {
      telegramLinkToken: token,
      telegramLinkTokenExpiresAt: new Date(Date.now() + TELEGRAM_LINK_TOKEN_TTL_MS),
    },
  });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  return NextResponse.json({
    data: { telegramUrl: `https://t.me/${botUsername}?start=${token}` },
  });
}

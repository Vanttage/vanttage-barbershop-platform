import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/src/lib/rateLimit";
import { getTenantContext } from "@/src/lib/tenant";
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
  const slugFromBody = typeof body?.tenantSlug === "string" ? body.tenantSlug : null;
  if (!clientId) {
    return NextResponse.json({ error: "clientId es obligatorio" }, { status: 400 });
  }

  const ctx = await getTenantContext(slugFromBody);
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  // Filtrar por tenantId evita que un clientId de otra barbería (adivinado o
  // reusado) se vincule a Telegram fuera de su propio tenant.
  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId: ctx.tenantId },
  });
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { buildTelegramWelcomeMessage, sendTelegramMessage } from "@/src/lib/telegram";

/**
 * Recibe los updates de Telegram (configurado vía setWebhook, ver
 * scripts/telegram-setup.ts). Por ahora solo procesa /start <token>, que es
 * como un cliente vincula su chat después de reservar en /reservar — ver
 * POST /api/public/telegram-link para cómo se genera ese token.
 *
 * Siempre responde 200 así el update falle (mala práctica devolver error:
 * Telegram reintenta agresivamente y no hay nada que el remitente pueda
 * corregir del lado suyo).
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const update = await request.json().catch(() => null);
  const message = update?.message;
  const chatId: number | undefined = message?.chat?.id;
  const text: string | undefined = message?.text;

  if (!chatId || !text) {
    return NextResponse.json({ ok: true });
  }

  const startMatch = /^\/start(?:\s+(\S+))?/.exec(text.trim());
  if (!startMatch) {
    return NextResponse.json({ ok: true });
  }

  const token = startMatch[1];
  if (!token) {
    await sendTelegramMessage({
      chatId: String(chatId),
      text:
        "👋 Hola. Para vincular tu cuenta, usa el botón \"Recibir por Telegram\" " +
        "que aparece justo después de hacer una reserva en NAVA.",
    });
    return NextResponse.json({ ok: true });
  }

  const client = await prisma.client.findUnique({
    where: { telegramLinkToken: token },
    include: { tenant: { select: { name: true } } },
  });

  const tokenValid =
    client &&
    client.telegramLinkTokenExpiresAt &&
    client.telegramLinkTokenExpiresAt.getTime() > Date.now();

  if (!client || !tokenValid) {
    await sendTelegramMessage({
      chatId: String(chatId),
      text:
        "⚠️ Ese enlace ya no es válido (expiró o ya se usó). Vuelve a tu reserva " +
        "en NAVA y toca de nuevo \"Recibir por Telegram\".",
    });
    return NextResponse.json({ ok: true });
  }

  // Un chat de Telegram solo puede pertenecer a un cliente NAVA — si ya
  // estaba vinculado a otro (ej. alguien reenvió el link), se reasigna al
  // que acaba de usarlo, que es el que tiene el token válido en este momento.
  await prisma.client.updateMany({
    where: { telegramChatId: String(chatId), id: { not: client.id } },
    data: { telegramChatId: null, telegramLinkedAt: null },
  });

  await prisma.client.update({
    where: { id: client.id },
    data: {
      telegramChatId: String(chatId),
      telegramLinkedAt: new Date(),
      telegramLinkToken: null,
      telegramLinkTokenExpiresAt: null,
    },
  });

  await sendTelegramMessage({
    chatId: String(chatId),
    text: buildTelegramWelcomeMessage(client.tenant.name),
  });

  return NextResponse.json({ ok: true });
}

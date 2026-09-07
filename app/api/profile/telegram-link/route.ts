import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import {
  TELEGRAM_LINK_TOKEN_TTL_MS,
  generateTelegramLinkToken,
  isTelegramConfigured,
} from "@/src/lib/telegram";

/**
 * Genera el token de un solo uso para que el dueño/barbero vincule su propio
 * Telegram desde Mi Perfil, y así recibir aviso de cada reserva nueva. Mismo
 * mecanismo que POST /api/public/telegram-link (para clientes), pero
 * autenticado y sobre el usuario de la sesión en vez de un Client.
 */
export async function POST() {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isTelegramConfigured() || !process.env.TELEGRAM_BOT_USERNAME) {
    return NextResponse.json({ error: "Telegram no está disponible" }, { status: 503 });
  }

  const token = generateTelegramLinkToken();
  await prisma.user.update({
    where: { id: auth.user.id },
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

/** Desvincula el Telegram del usuario en sesión. */
export async function DELETE() {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { telegramChatId: null, telegramLinkToken: null, telegramLinkTokenExpiresAt: null },
  });

  return NextResponse.json({ data: { ok: true } });
}

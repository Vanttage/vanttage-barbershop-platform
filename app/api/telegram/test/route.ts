import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { isTelegramConfigured, sendTelegramMessage } from "@/src/lib/telegram";

/** Envía un mensaje de prueba al cliente conectado más reciente del tenant. */
export async function POST() {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json({ error: "Telegram no está configurado" }, { status: 503 });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const client = await prisma.client.findFirst({
    where: { tenantId: ctx.tenantId, telegramChatId: { not: null } },
    orderBy: { telegramLinkedAt: "desc" },
  });

  if (!client?.telegramChatId) {
    return NextResponse.json(
      { error: "Todavía no tienes ningún cliente conectado por Telegram para probar." },
      { status: 409 },
    );
  }

  const result = await sendTelegramMessage({
    chatId: client.telegramChatId,
    text: `🔔 <b>Notificación de prueba</b>\n\nEsto es un mensaje de prueba desde ${ctx.barbershopName}.`,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "No se pudo enviar" }, { status: 502 });
  }

  return NextResponse.json({ data: { sentTo: client.name } });
}

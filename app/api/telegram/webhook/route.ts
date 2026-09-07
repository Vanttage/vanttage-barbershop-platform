import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { invalidateByPrefix } from "@/src/lib/apiCache";
import {
  buildTelegramCancellationAlertMessage,
  buildTelegramCancelledMessage,
  buildTelegramCancelPromptMessage,
  buildTelegramOwnerWelcomeMessage,
  buildTelegramWelcomeMessage,
  isTelegramConfigured,
  sendTelegramMessage,
} from "@/src/lib/telegram";

/**
 * Recibe los updates de Telegram (configurado vía setWebhook, ver
 * scripts/telegram-setup.ts). Procesa:
 *  - /start <token>: vincula el chat con un Client o un User (dueño) — ver
 *    POST /api/public/telegram-link y POST /api/profile/telegram-link.
 *  - /cancelar y /confirmar: le permite al cliente cancelar su propia
 *    próxima cita sin entrar a NAVA.
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

  const trimmed = text.trim();

  if (/^\/cancelar/i.test(trimmed)) {
    return handleCancelRequest(chatId);
  }

  if (/^\/confirmar/i.test(trimmed)) {
    return handleCancelConfirm(chatId);
  }

  const startMatch = /^\/start(?:\s+(\S+))?/.exec(trimmed);
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

  const clientTokenValid =
    client &&
    client.telegramLinkTokenExpiresAt &&
    client.telegramLinkTokenExpiresAt.getTime() > Date.now();

  if (client && clientTokenValid) {
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

  // No era un token de cliente (o expiró) — probar como token de
  // dueño/barbero (generado desde Mi Perfil, ver POST /api/profile/telegram-link).
  const user = await prisma.user.findUnique({
    where: { telegramLinkToken: token },
    include: { tenant: { select: { name: true } } },
  });

  const userTokenValid =
    user &&
    user.telegramLinkTokenExpiresAt &&
    user.telegramLinkTokenExpiresAt.getTime() > Date.now();

  if (user && userTokenValid) {
    await prisma.user.updateMany({
      where: { telegramChatId: String(chatId), id: { not: user.id } },
      data: { telegramChatId: null },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: String(chatId),
        telegramLinkToken: null,
        telegramLinkTokenExpiresAt: null,
      },
    });

    await sendTelegramMessage({
      chatId: String(chatId),
      text: buildTelegramOwnerWelcomeMessage(user.tenant?.name ?? "tu barbería"),
    });

    return NextResponse.json({ ok: true });
  }

  await sendTelegramMessage({
    chatId: String(chatId),
    text:
      "⚠️ Ese enlace ya no es válido (expiró o ya se usó). Vuelve a intentarlo " +
      "desde donde lo generaste en NAVA.",
  });
  return NextResponse.json({ ok: true });
}

// ── Cancelación desde el chat ─────────────────────────────────────────────

function findClientByChatId(chatId: number) {
  return prisma.client.findUnique({
    where: { telegramChatId: String(chatId) },
    include: { tenant: { select: { id: true, name: true, telegramEnabled: true } } },
  });
}

function findNextAppointment(clientId: string) {
  return prisma.appointment.findFirst({
    where: {
      clientId,
      status: { in: ["pending", "confirmed"] },
      startsAt: { gt: new Date() },
    },
    orderBy: { startsAt: "asc" },
    include: {
      barber: { select: { name: true } },
      service: { select: { name: true } },
    },
  });
}

/** /cancelar — muestra la próxima cita del cliente y pide confirmar con /confirmar. */
async function handleCancelRequest(chatId: number) {
  const client = await findClientByChatId(chatId);
  if (!client) {
    await sendTelegramMessage({
      chatId: String(chatId),
      text: "No encontramos ninguna cuenta de NAVA vinculada a este chat.",
    });
    return NextResponse.json({ ok: true });
  }

  const appt = await findNextAppointment(client.id);
  if (!appt) {
    await sendTelegramMessage({
      chatId: String(chatId),
      text: "No tienes ninguna cita próxima para cancelar.",
    });
    return NextResponse.json({ ok: true });
  }

  await sendTelegramMessage({
    chatId: String(chatId),
    text: buildTelegramCancelPromptMessage({
      serviceName: appt.service.name,
      barberName: appt.barber.name,
      startsAt: appt.startsAt,
    }),
  });
  return NextResponse.json({ ok: true });
}

/** /confirmar — cancela de verdad la próxima cita del cliente (tras /cancelar). */
async function handleCancelConfirm(chatId: number) {
  const client = await findClientByChatId(chatId);
  if (!client) {
    await sendTelegramMessage({
      chatId: String(chatId),
      text: "No encontramos ninguna cuenta de NAVA vinculada a este chat.",
    });
    return NextResponse.json({ ok: true });
  }

  const appt = await findNextAppointment(client.id);
  if (!appt) {
    await sendTelegramMessage({
      chatId: String(chatId),
      text: "No tienes ninguna cita pendiente por cancelar. Escribe /cancelar primero.",
    });
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appt.id },
      data: { status: "cancelled", cancelReason: "Cancelada por el cliente vía Telegram" },
    });
    await tx.appointmentHistory.create({
      data: {
        tenantId: client.tenantId,
        appointmentId: appt.id,
        status: "cancelled",
        observations: "Cancelada por el cliente vía Telegram",
        servicePerformed: appt.service.name,
      },
    });
  });

  invalidateByPrefix(`dashboard:${client.barbershopId}`);

  await sendTelegramMessage({
    chatId: String(chatId),
    text: buildTelegramCancelledMessage({
      clientName: client.name,
      startsAt: appt.startsAt,
      tenantName: client.tenant.name,
    }),
  });

  // Avisa al dueño/barbero vinculado — simétrico al aviso de "nueva reserva".
  if (client.tenant.telegramEnabled && isTelegramConfigured()) {
    const owners = await prisma.user.findMany({
      where: { tenantId: client.tenantId, telegramChatId: { not: null } },
      select: { telegramChatId: true },
    });

    for (const owner of owners) {
      const ownerMessage = buildTelegramCancellationAlertMessage({
        clientName: client.name,
        startsAt: appt.startsAt,
      });
      const result = await sendTelegramMessage({
        chatId: owner.telegramChatId!,
        text: ownerMessage,
      });

      await prisma.notification.create({
        data: {
          tenantId: client.tenantId,
          appointmentId: appt.id,
          clientId: client.id,
          channel: "telegram",
          type: "cancellation_alert",
          status: result.success ? "sent" : "failed",
          recipient: owner.telegramChatId!,
          title: "Cancelación de cita",
          message: ownerMessage,
          errorMessage: result.error,
          sentAt: result.success ? new Date() : null,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}

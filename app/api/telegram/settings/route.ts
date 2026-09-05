import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { isTelegramConfigured } from "@/src/lib/telegram";

export async function GET() {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const [tenant, connectedClients] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { telegramEnabled: true },
    }),
    prisma.client.findMany({
      where: { tenantId: ctx.tenantId, telegramChatId: { not: null } },
      select: { id: true, name: true, phone: true, telegramLinkedAt: true },
      orderBy: { telegramLinkedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    data: {
      serviceConfigured: isTelegramConfigured(),
      enabled: tenant?.telegramEnabled ?? true,
      connectedClients,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled (boolean) es obligatorio" }, { status: 400 });
  }

  await prisma.tenant.update({
    where: { id: ctx.tenantId },
    data: { telegramEnabled: body.enabled },
  });

  return NextResponse.json({ data: { enabled: body.enabled } });
}

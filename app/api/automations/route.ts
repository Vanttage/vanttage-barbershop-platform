import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { validateBody } from "@/src/validations";
import { AUTOMATION_KEYS, type AutomationKey } from "@/src/lib/automations";

// ── GET /api/automations ──────────────────────────────────────────────────────
// Returns the 6 automation toggles for the current tenant.

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      plan: true,
      autoConfirmacion: true,
      autoReminder24h: true,
      autoReminder1h: true,
      autoReviewRequest: true,
      autoReactivacion: true,
      autoWeeklyReport: true,
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: tenant });
}

// ── PATCH /api/automations ────────────────────────────────────────────────────
// Toggle a single automation on/off.

const UpdateSchema = z.object({
  key: z.enum(AUTOMATION_KEYS),
  enabled: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = validateBody(UpdateSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { key, enabled } = parsed.data;

  // Plan gate: pro/premium-only automations
  const premiumKeys: AutomationKey[] = ["autoReviewRequest", "autoReactivacion", "autoWeeklyReport"];
  if (premiumKeys.includes(key)) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { plan: true },
    });
    if (tenant?.plan === "basico") {
      return NextResponse.json(
        { error: "Esta automatización requiere plan Pro o Premium." },
        { status: 403 },
      );
    }
  }

  const updated = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { [key]: enabled },
    select: {
      autoConfirmacion: true,
      autoReminder24h: true,
      autoReminder1h: true,
      autoReviewRequest: true,
      autoReactivacion: true,
      autoWeeklyReport: true,
    },
  });

  return NextResponse.json({ data: updated });
}

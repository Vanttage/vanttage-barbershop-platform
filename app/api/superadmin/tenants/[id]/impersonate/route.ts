import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";

type Params = { params: Promise<{ id: string }> };

const IMPERSONATION_TOKEN_TTL_MS = 60_000;

/**
 * Genera un token de un solo uso (60s de vida) para que el superadmin entre
 * como el dueño de un tenant, sin conocer su contraseña. El frontend lo usa
 * de inmediato con signIn("credentials", { impersonationToken }) — ver
 * authorize() en src/lib/auth.ts.
 */
export async function POST(_request: Request, { params }: Params) {
  const auth = await requireUserWithRole(["superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  const owner = await prisma.user.findFirst({
    where: { tenantId: id, role: "owner" },
    orderBy: { createdAt: "asc" },
  });

  if (!owner) {
    return NextResponse.json(
      { error: "Esta barbería no tiene un usuario dueño para entrar como él." },
      { status: 404 },
    );
  }

  const token = crypto.randomBytes(24).toString("base64url");
  await prisma.user.update({
    where: { id: owner.id },
    data: {
      impersonationToken: token,
      impersonationTokenExpiresAt: new Date(Date.now() + IMPERSONATION_TOKEN_TTL_MS),
    },
  });

  return NextResponse.json({ data: { token } });
}

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sendPasswordResetEmail } from "@/src/lib/email";
import { ForgotPasswordSchema, validateBody } from "@/src/validations";
import { rateLimit, rateLimitResponse } from "@/src/lib/rateLimit";

const GENERIC_RESPONSE = {
  data: {
    message:
      "Si el correo existe, recibiras instrucciones para restablecer la contrasena.",
  },
};

export async function POST(request: NextRequest) {
  // 5 intentos por IP cada 15 minutos
  const rl = await rateLimit(request, { limit: 5, windowMs: 15 * 60_000, prefix: "forgot-pw" });
  if (!rl.ok) return rateLimitResponse(rl);

  const body = await request.json();
  const parsed = validateBody(ForgotPasswordSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true, email: true, name: true, tenantId: true },
  });

  // Always return 200 to avoid email enumeration
  if (!user) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  // Invalidate previous tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const isDev = process.env.NODE_ENV !== "production";
  const hasResend = Boolean(process.env.RESEND_API_KEY);

  if (hasResend) {
    const { ok, error } = await sendPasswordResetEmail({
      to: user.email,
      name: user.name ?? user.email,
      token,
    });

    if (!ok) {
      console.error("[forgot-password] Email send failed:", error);
    }
  }

  return NextResponse.json({
    ...GENERIC_RESPONSE,
    // Only expose token in dev when Resend is not configured
    ...(isDev && !hasResend
      ? {
          _dev: {
            resetToken: token,
            resetUrl: `/reset-password?token=${token}`,
          },
        }
      : {}),
  });
}

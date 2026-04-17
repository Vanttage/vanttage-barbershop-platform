import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sendPasswordChangedEmail } from "@/src/lib/email";
import { ResetPasswordSchema, validateBody } from "@/src/validations";
import { rateLimit, rateLimitResponse } from "@/src/lib/rateLimit";

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, { limit: 10, windowMs: 15 * 60_000, prefix: "reset-pw" });
  if (!rl.ok) return rateLimitResponse(rl);

  const body = await request.json();
  const parsed = validateBody(ResetPasswordSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
    include: { user: true },
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "El token es invalido o ya expiro" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // Fire-and-forget confirmation email
  if (process.env.RESEND_API_KEY) {
    sendPasswordChangedEmail({
      to: resetToken.user.email,
      name: resetToken.user.name ?? resetToken.user.email,
    }).catch((err) => console.error("[reset-password] Email send failed:", err));
  }

  return NextResponse.json({
    data: { message: "Contrasena actualizada correctamente" },
  });
}

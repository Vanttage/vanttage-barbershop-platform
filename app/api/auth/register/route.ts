import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { RegisterSchema, validateBody } from "@/src/validations";
import { rateLimit, rateLimitResponse } from "@/src/lib/rateLimit";
import { createTenantWithOwner, sendWelcomeEmailSafely } from "@/src/services/tenantOnboarding";

export async function POST(request: NextRequest) {
  // 3 registros por IP por hora
  const rl = await rateLimit(request, { limit: 3, windowMs: 60 * 60_000, prefix: "register" });
  if (!rl.ok) return rateLimitResponse(rl);

  const body = await request.json();
  const parsed = validateBody(RegisterSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const {
    tenantName,
    slug,
    city,
    country,
    phone,
    instagram,
    plan,
    email,
    password,
    name,
  } = parsed.data;

  const [existingTenant, existingUser] = await Promise.all([
    prisma.tenant.findUnique({ where: { slug } }),
    prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
  ]);

  if (existingTenant) {
    return NextResponse.json(
      { error: "Ese slug ya esta en uso" },
      { status: 409 },
    );
  }

  if (existingUser) {
    return NextResponse.json(
      { error: "Ese email ya esta registrado" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await createTenantWithOwner({
    tenantName,
    slug,
    email: email.toLowerCase(),
    name: name ?? tenantName,
    passwordHash,
    city,
    country,
    phone,
    instagram,
    plan,
  });

  await sendWelcomeEmailSafely({
    email: result.user.email,
    ownerName: result.user.name,
    tenantName: result.tenant.name,
    tenantSlug: result.tenant.slug,
  });

  return NextResponse.json(
    {
      data: {
        tenantSlug: result.tenant.slug,
        barbershopSlug: result.barbershop.slug,
        email: result.user.email,
      },
    },
    { status: 201 },
  );
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { GOOGLE_PENDING_PREFIX } from "@/src/lib/googleAuth";
import { prisma } from "@/src/lib/prisma";
import { CompleteGoogleRegistrationSchema, validateBody } from "@/src/validations";
import { rateLimit, rateLimitResponse } from "@/src/lib/rateLimit";
import { createTenantWithOwner } from "@/src/services/tenantOnboarding";

/**
 * Segundo paso de "Continuar con Google" en /register: la sesión ya existe
 * (Google verificó el correo en profile()/signIn(), ver src/lib/auth.ts)
 * pero sigue "pendiente" — sin tenantId, con un id sintético — porque
 * todavía no hay fila en `users`. Este endpoint solo pide lo que Google no
 * sabe (nombre de la barbería + teléfono) y crea la cuenta sin contraseña.
 */
export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, { limit: 5, windowMs: 60 * 60_000, prefix: "register-google" });
  if (!rl.ok) return rateLimitResponse(rl);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id.startsWith(GOOGLE_PENDING_PREFIX)) {
    return NextResponse.json(
      { error: "Inicia sesión con Google desde /register para continuar." },
      { status: 401 },
    );
  }

  if (session.user.tenantId) {
    return NextResponse.json(
      { error: "Ya tienes una barbería creada." },
      { status: 409 },
    );
  }

  const body = await request.json();
  const parsed = validateBody(CompleteGoogleRegistrationSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { tenantName, slug, city, country, phone, instagram, plan } = parsed.data;
  const email = session.user.email.toLowerCase();

  const [existingTenant, existingUser] = await Promise.all([
    prisma.tenant.findUnique({ where: { slug } }),
    prisma.user.findUnique({ where: { email } }),
  ]);

  if (existingTenant) {
    return NextResponse.json({ error: "Ese slug ya esta en uso" }, { status: 409 });
  }

  if (existingUser) {
    return NextResponse.json({ error: "Ese email ya esta registrado" }, { status: 409 });
  }

  const result = await createTenantWithOwner({
    tenantName,
    slug,
    email,
    name: session.user.name ?? tenantName,
    passwordHash: null,
    city,
    country,
    phone,
    instagram,
    plan,
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

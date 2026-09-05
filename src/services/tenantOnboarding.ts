import { prisma } from "@/src/lib/prisma";
import { sendWelcomeEmail } from "@/src/lib/email";

const DEFAULT_SERVICE_CATEGORIES = [
  {
    name: "Corte clasico",
    description: "Servicios de corte tradicional y ejecutivo.",
    icon: "scissors",
  },
  {
    name: "Fade",
    description: "Desvanecidos y acabados modernos.",
    icon: "sparkles",
  },
  {
    name: "Barba",
    description: "Perfilado y arreglo de barba.",
    icon: "beard",
  },
  {
    name: "Premium",
    description: "Servicios combinados de mayor valor.",
    icon: "crown",
  },
];

interface CreateTenantWithOwnerInput {
  tenantName: string;
  slug: string;
  email: string;
  name: string;
  /** null para cuentas creadas solo con Google (sin contraseña). */
  passwordHash: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  instagram?: string | null;
  plan: "basico" | "pro" | "premium";
}

/**
 * Crea Tenant + Barbershop + User(owner) + membership + categorías/servicios
 * por defecto en una sola transacción. Usado tanto por el registro
 * tradicional (con contraseña) como por el registro vía Google (sin
 * contraseña) — ver app/api/auth/register/route.ts y
 * app/api/auth/register/google/route.ts.
 */
export async function createTenantWithOwner(input: CreateTenantWithOwnerInput) {
  const {
    tenantName,
    slug,
    email,
    name,
    passwordHash,
    city,
    country,
    phone,
    instagram,
    plan,
  } = input;

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: tenantName,
        slug,
        plan,
        email,
        phoneWa: phone ?? null,
        city: city ?? null,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const barbershop = await tx.barbershop.create({
      data: {
        tenantId: tenant.id,
        name: tenantName,
        slug,
        city: city ?? null,
        country: country ?? "Colombia",
        phone: phone ?? null,
        whatsapp: phone ?? null,
        instagram: instagram ?? null,
        openingTime: "09:00",
        closingTime: "19:00",
      },
    });

    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        defaultBarbershopId: barbershop.id,
        email,
        passwordHash,
        name,
        phone: phone ?? null,
        role: "owner",
      },
    });

    await tx.tenant.update({
      where: { id: tenant.id },
      data: { primaryBarbershopId: barbershop.id },
    });

    await tx.barbershopMembership.create({
      data: {
        tenantId: tenant.id,
        barbershopId: barbershop.id,
        userId: user.id,
        role: "owner",
      },
    });

    const categories = await Promise.all(
      DEFAULT_SERVICE_CATEGORIES.map((category, index) =>
        tx.serviceCategory.create({
          data: {
            tenantId: tenant.id,
            ...category,
            orderIndex: index + 1,
          },
        }),
      ),
    );

    await tx.service.createMany({
      data: [
        {
          tenantId: tenant.id,
          barbershopId: barbershop.id,
          categoryId: categories[0].id,
          name: "Corte clasico",
          durationMin: 30,
          price: 30000,
          orderIndex: 1,
        },
        {
          tenantId: tenant.id,
          barbershopId: barbershop.id,
          categoryId: categories[1].id,
          name: "Fade premium",
          durationMin: 45,
          price: 38000,
          orderIndex: 2,
        },
        {
          tenantId: tenant.id,
          barbershopId: barbershop.id,
          categoryId: categories[3].id,
          name: "Corte y barba",
          durationMin: 60,
          price: 52000,
          orderIndex: 3,
        },
      ],
    });

    return { tenant, barbershop, user };
  });
}

/**
 * Envía el correo de bienvenida — separado de createTenantWithOwner() porque
 * si el envío falla, NO debe tumbar el registro (la cuenta ya quedó creada
 * en la transacción de arriba). Llamar despues de crear la cuenta.
 */
export async function sendWelcomeEmailSafely(params: {
  email: string;
  ownerName: string;
  tenantName: string;
  tenantSlug: string;
}) {
  const result = await sendWelcomeEmail({
    to: params.email,
    ownerName: params.ownerName,
    barbershopName: params.tenantName,
    tenantSlug: params.tenantSlug,
  }).catch((err) => ({ ok: false, error: err instanceof Error ? err.message : String(err) }));

  if (!result.ok) {
    console.error("[register] No se pudo enviar el correo de bienvenida:", result.error);
  }
}

import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { RegisterSchema, validateBody } from "@/src/validations";
import { rateLimit, rateLimitResponse } from "@/src/lib/rateLimit";

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

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: tenantName,
        slug,
        plan,
        email: email.toLowerCase(),
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
        email: email.toLowerCase(),
        passwordHash,
        name: name ?? tenantName,
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

    return {
      tenant,
      barbershop,
      user,
    };
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

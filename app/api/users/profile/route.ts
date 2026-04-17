import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { validateBody, UpdateProfileSchema } from "@/src/validations";

// GET /api/users/profile - Get current user's profile
export async function GET(request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin", "client"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatarUrl: true,
      tenantId: true,
      defaultBarbershopId: true,
      tenant: {
        select: {
          id: true,
          slug: true,
        },
      },
      defaultBarbershop: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      tenantId: user.tenantId,
      tenantSlug: user.tenant?.slug ?? null,
      barbershopId: user.defaultBarbershopId,
      barbershopSlug: user.defaultBarbershop?.slug ?? null,
    },
  });
}

// PATCH /api/users/profile - Update current user's profile
export async function PATCH(request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin", "client"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = validateBody(UpdateProfileSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Build update data, filtering out empty strings
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.email) updateData.email = parsed.data.email;
  if (parsed.data.phone) updateData.phone = parsed.data.phone;
  if (parsed.data.avatarUrl !== undefined) {
    updateData.avatarUrl = parsed.data.avatarUrl === "" ? null : parsed.data.avatarUrl;
  }

  try {
    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatarUrl: true,
        tenantId: true,
        defaultBarbershopId: true,
        tenant: {
          select: {
            id: true,
            slug: true,
          },
        },
        defaultBarbershop: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
      data: updateData,
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        phone: updated.phone,
        avatarUrl: updated.avatarUrl,
        tenantId: updated.tenantId,
        tenantSlug: updated.tenant?.slug ?? null,
        barbershopId: updated.defaultBarbershopId,
        barbershopSlug: updated.defaultBarbershop?.slug ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "El email ya esta registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

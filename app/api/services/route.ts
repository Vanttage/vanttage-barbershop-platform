import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { getTenantContext } from "@/src/lib/tenant";
import { CreateServiceSchema, validateBody } from "@/src/validations";

export async function GET(request: NextRequest) {
  const slugFromQuery = request.nextUrl.searchParams.get("tenantSlug");
  const ctx = await getTenantContext(slugFromQuery);
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const onlyActive = request.nextUrl.searchParams.get("active") !== "false";
  const services = await prisma.service.findMany({
    where: {
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
      ...(onlyActive ? { active: true } : {}),
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
  });

  const res = NextResponse.json({ data: services });
  // El catálogo de servicios cambia raramente — cachear 2 min
  res.headers.set("Cache-Control", "private, max-age=120, stale-while-revalidate=300");
  return res;
}

export async function POST(request: NextRequest) {
  const auth = await requireUserWithRole(["owner", "superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = validateBody(CreateServiceSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.data.categoryId) {
    const category = await prisma.serviceCategory.findFirst({
      where: {
        id: parsed.data.categoryId,
        tenantId: ctx.tenantId,
        active: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria no encontrada" },
        { status: 404 },
      );
    }
  }

  const lastService = await prisma.service.findFirst({
    where: {
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
    },
    orderBy: { orderIndex: "desc" },
  });

  const service = await prisma.service.create({
    data: {
      tenantId: ctx.tenantId,
      barbershopId: ctx.barbershopId,
      ...parsed.data,
      orderIndex: (lastService?.orderIndex ?? 0) + 1,
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json({ data: service }, { status: 201 });
}

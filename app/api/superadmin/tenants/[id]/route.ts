import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { requireUserWithRole } from "@/src/lib/authorization";
import { validateBody } from "@/src/validations";

type Params = { params: Promise<{ id: string }> };

const UpdateTenantSchema = z.object({
  active: z.boolean().optional(),
  plan: z.enum(["basico", "pro", "premium"]).optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireUserWithRole(["superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = validateBody(UpdateTenantSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updated = await prisma.tenant.update({
    where: { id },
    data: parsed.data,
    include: {
      _count: { select: { appointments: true, clients: true, barbers: true } },
    },
  });

  return NextResponse.json({ data: updated });
}

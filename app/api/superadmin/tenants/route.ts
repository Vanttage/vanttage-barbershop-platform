import { NextResponse } from "next/server";
import { requireUserWithRole } from "@/src/lib/authorization";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const auth = await requireUserWithRole(["superadmin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: {
          appointments: true,
          clients: true,
          barbers: true,
        },
      },
      primaryBarbershop: {
        select: {
          city: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: tenants.map((tenant) => ({
      ...tenant,
      city: tenant.primaryBarbershop?.city ?? tenant.city,
    })),
  });
}

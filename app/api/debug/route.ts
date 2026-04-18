// TEMPORAL — borrar tras diagnosticar
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const headersList = await headers();
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  return NextResponse.json({
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "❌ NO SET",
      NEXT_PUBLIC_BASE_DOMAIN: process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "❌ NO SET",
      NEXTAUTH_SECRET_SET: Boolean(process.env.NEXTAUTH_SECRET),
    },
    middleware_header: {
      "x-tenant-slug": headersList.get("x-tenant-slug") ?? "❌ NOT INJECTED",
    },
    jwt_token: token
      ? {
          role: token.role,
          tenantSlug: token.tenantSlug ?? "❌ NULL",
          barbershopId: token.barbershopId ?? "❌ NULL",
        }
      : "❌ TOKEN NULL — getToken() returned null",
  });
}

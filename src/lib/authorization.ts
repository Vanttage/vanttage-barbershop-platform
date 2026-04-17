import { getServerSession } from "next-auth";
import type { UserRole } from "@prisma/client";
import { authOptions } from "@/src/lib/auth";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export function hasRequiredRole(
  role: UserRole | undefined,
  allowedRoles: UserRole[],
) {
  return !!role && allowedRoles.includes(role);
}

export async function requireUserWithRole(allowedRoles?: UserRole[]) {
  const user = await getSessionUser();

  if (!user) {
    return { ok: false as const, status: 401, error: "No autenticado" };
  }

  if (allowedRoles && !hasRequiredRole(user.role, allowedRoles)) {
    return {
      ok: false as const,
      status: 403,
      error: "No tienes permisos para esta accion",
    };
  }

  return { ok: true as const, user };
}

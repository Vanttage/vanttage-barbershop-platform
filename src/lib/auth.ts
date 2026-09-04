import bcrypt from "bcryptjs";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { GOOGLE_DENIED_PREFIX, GOOGLE_PENDING_PREFIX } from "@/src/lib/googleAuth";

/**
 * Google funciona tanto para iniciar sesión (cuenta existente) como para
 * registrarse (cuenta nueva) — igual que "Continuar con Google" en la
 * mayoría de apps. profile() resuelve el correo verificado por Google en
 * tres estados posibles:
 *
 * - "active"  → ya existe un usuario NAVA activo con ese correo: login normal.
 * - "blocked" → existe pero está inactivo (usuario/tenant/barbería
 *               desactivados): se rechaza, no se reactiva por esta vía.
 * - "new"     → no existe ninguna fila en `users`: se crea una sesión
 *               "pendiente" (sin tenantId) que el middleware redirige a
 *               /register/completar para terminar el registro sin pedir
 *               contraseña — ver app/api/auth/register/google/route.ts.
 *
 * NextAuth v4 se traga cualquier excepción lanzada dentro de `profile()`
 * (solo hace logger.error internamente) y redirige de vuelta a /login SIN
 * ningún ?error= en la URL — probado en runtime. Por eso "blocked" no lanza:
 * profile() devuelve un usuario con un id sintético (que nunca existe en la
 * tabla users) y el callback signIn() de abajo sí puede redirigir con un
 * error específico.
 */
type GoogleAccountResolution =
  | { status: "active"; user: NonNullable<Awaited<ReturnType<typeof findUserWithRelationsByEmail>>> }
  | { status: "blocked" }
  | { status: "new" };

function findUserWithRelationsByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      tenant: { select: { id: true, slug: true, active: true } },
      defaultBarbershop: { select: { id: true, slug: true, active: true } },
    },
  });
}

async function resolveGoogleAccount(email: string): Promise<GoogleAccountResolution> {
  const user = await findUserWithRelationsByEmail(email);
  if (!user) return { status: "new" };

  if (!user.active) return { status: "blocked" };
  if (user.tenant && !user.tenant.active) return { status: "blocked" };
  if (user.defaultBarbershop && !user.defaultBarbershop.active) return { status: "blocked" };

  return { status: "active", user };
}

type SessionUser = DefaultSession["user"] & {
  id: string;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
  barbershopId: string | null;
  barbershopSlug: string | null;
};

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  interface User {
    id: string;
    role: UserRole;
    tenantId: string | null;
    tenantSlug: string | null;
    barbershopId: string | null;
    barbershopSlug: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    tenantId: string | null;
    tenantSlug: string | null;
    barbershopId: string | null;
    barbershopSlug: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: { params: { prompt: "select_account" } },
            async profile(profile: GoogleProfile) {
              const email = profile.email?.toLowerCase().trim();

              const sentinel = (prefix: string) => ({
                id: `${prefix}${profile.sub}`,
                email: email ?? "",
                name: profile.name ?? "",
                role: "client" as UserRole,
                tenantId: null,
                tenantSlug: null,
                barbershopId: null,
                barbershopSlug: null,
              });

              if (!email || !profile.email_verified) {
                return sentinel(GOOGLE_DENIED_PREFIX);
              }

              const resolved = await resolveGoogleAccount(email);

              if (resolved.status === "blocked") {
                return sentinel(GOOGLE_DENIED_PREFIX);
              }

              if (resolved.status === "new") {
                return sentinel(GOOGLE_PENDING_PREFIX);
              }

              const { user } = resolved;
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  lastLoginAt: new Date(),
                  avatarUrl: user.avatarUrl ?? profile.picture ?? null,
                },
              });

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId,
                tenantSlug: user.tenant?.slug ?? null,
                barbershopId: user.defaultBarbershopId,
                barbershopSlug: user.defaultBarbershop?.slug ?? null,
              };
            },
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contrasena", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            tenant: {
              select: {
                id: true,
                slug: true,
                active: true,
              },
            },
            defaultBarbershop: {
              select: {
                id: true,
                slug: true,
                active: true,
              },
            },
          },
        });

        if (!user || !user.active || !user.passwordHash) {
          return null;
        }

        if (user.tenant && !user.tenant.active) {
          return null;
        }

        if (user.defaultBarbershop && !user.defaultBarbershop.active) {
          return null;
        }

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!passwordValid) {
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant?.slug ?? null,
          barbershopId: user.defaultBarbershopId,
          barbershopSlug: user.defaultBarbershop?.slug ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (
        account?.provider === "google" &&
        user.id.startsWith(GOOGLE_DENIED_PREFIX)
      ) {
        return "/login?error=GoogleNoAccount";
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.barbershopId = user.barbershopId;
        token.barbershopSlug = user.barbershopSlug;
      }

      // Disparado por useSession().update() en /register/completar justo
      // después de crear la barbería: la sesión de Google seguía "pendiente"
      // (tenantId null, id sintético) porque en el momento del signIn()
      // original todavía no existía la fila en `users`. Se relee por email
      // (estable desde el signIn de Google) en vez de confiar en lo que
      // mande el cliente — así no se puede falsificar el rol/tenant.
      if (trigger === "update" && token.email) {
        const fresh = await findUserWithRelationsByEmail(token.email);
        if (fresh && fresh.active) {
          token.id = fresh.id;
          token.role = fresh.role;
          token.tenantId = fresh.tenantId;
          token.tenantSlug = fresh.tenant?.slug ?? null;
          token.barbershopId = fresh.defaultBarbershopId;
          token.barbershopSlug = fresh.defaultBarbershop?.slug ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        role: token.role,
        tenantId: token.tenantId,
        tenantSlug: token.tenantSlug,
        barbershopId: token.barbershopId,
        barbershopSlug: token.barbershopSlug,
      };

      return session;
    },
  },
};

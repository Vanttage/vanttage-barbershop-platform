import bcrypt from "bcryptjs";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.barbershopId = user.barbershopId;
        token.barbershopSlug = user.barbershopSlug;
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

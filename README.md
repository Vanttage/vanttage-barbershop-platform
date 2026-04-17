# VANTTAGE

Plataforma SaaS multi-tenant para barberias construida con Next.js 14, TypeScript, Prisma, PostgreSQL/Supabase y NextAuth.

## Arquitectura respetada

- `app/(booking)` contiene la experiencia del cliente final.
- `app/(admin)` contiene el panel de la barberia.
- `app/(superadmin)` contiene el backoffice de VANTTAGE.
- `src/components/admin` concentra la UI reutilizable del dashboard.
- `src/lib` concentra infraestructura: auth, tenant, prisma, whatsapp.
- `src/jobs` concentra automatizaciones para Vercel Cron.
- `prisma/schema.prisma` es la fuente de verdad del modelo de datos.

## Rutas principales

- `/` muestra la landing comercial de VANTTAGE.
- `/reservar` expone el flujo publico de reservas.
- `/dashboard` expone el panel operativo de la barberia.
- `/superadmin` expone el backoffice interno.
- En subdominios tenant como `demo.vanttage.app`, la raiz `/` redirige automaticamente a `/reservar`.

## Multi-tenant

La aplicacion resuelve el tenant por subdominio mediante `src/middleware.ts` y `src/lib/tenant.ts`.

- `tenantId` identifica la cuenta SaaS.
- `barbershopId` identifica la sede operativa.
- Toda consulta operativa debe filtrar por ambos campos.

## Modelo de datos

El esquema cubre:

- `tenants`
- `barbershops`
- `users`
- `barbershop_memberships`
- `barbers`
- `service_categories`
- `services`
- `clients`
- `appointments`
- `appointment_history`
- `payments`
- `notifications`
- `password_reset_tokens`
- `barber_schedules`

La migracion inicial vive en [prisma/migrations/20260317052621_init/migration.sql](/c:/dev/VANTTAGE/vanttage_peluquerias/prisma/migrations/20260317052621_init/migration.sql).

## Variables de entorno

Usa `.env.example` como plantilla y define al menos:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_BASE_DOMAIN`
- `VANTTAGE_DEV_TENANT`

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
npm run validate
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Produccion

1. Configura PostgreSQL o Supabase.
2. Carga variables de entorno en Vercel.
3. Ejecuta migraciones con Prisma.
4. Ejecuta `npm run db:seed` solo en ambientes de demo o staging.
5. Despliega en Vercel.
6. Verifica que `vercel.json` active los cron jobs de reminders, reactivation y weekly report.

## Estado actual

- Build de produccion validado con `npm run build`.
- Typecheck validado con `npx tsc --noEmit`.
- El rol autenticado oficial quedo alineado a `client | owner | superadmin`.
- Se corrigio la ubicacion del modulo `superadmin` y de los componentes admin reutilizables.

## Nota de compatibilidad

La arquitectura original sugeria `next.config.ts`, pero Next.js 14.2.29 falla en build con ese formato. Se mantuvo `next.config.mjs` como excepcion tecnica minima para conservar compatibilidad real de produccion.

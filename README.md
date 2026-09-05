<div align="center">

# NAVA

**Software de gestión para barberías**

Agenda, clientes y pagos organizados en un solo lugar.

*by VANTTAGE Tech*

</div>

---

## Qué es NAVA

NAVA es una plataforma SaaS multi-tenant que le da a cada barbería su propio espacio de trabajo: agenda en tiempo real, ficha de clientes, control de caja y pagos, automatizaciones de recordatorios/reactivación, y un panel de administración por barbería, todo bajo un mismo producto operado por VANTTAGE Tech.

Construida con Next.js 14, TypeScript, Prisma, PostgreSQL/Supabase y NextAuth.

## Identidad de marca

| | |
|---|---|
| **Nombre de producto** | NAVA |
| **Operado por** | VANTTAGE Tech |
| **Tono** | Oscuro, minimalista, premium |
| **Tipografía de marca** | Syne (headers/logo) + Inter (texto) |
| **Acento landing** | Dorado `#C9A84C` (`gold`, ver `tailwind.config.js`) |
| **Acento producto/emails** | Verde esmeralda `#34D399` |
| **Fondo base** | `#09090B` / `#0b0b0c` |

El nombre interno del repositorio y del paquete (`vanttage`) es historia técnica: el producto de cara al usuario es **NAVA**. Los correos transaccionales (`src/lib/email.ts`) usan la firma `NAVA by VANTTAGE Tech` y comparten la paleta oscura + verde esmeralda de la landing y el dashboard.

## Quién usa NAVA

Tres roles autenticados, definidos en `src/lib/auth.ts`:

- **`client`** — cliente final de una barbería. Reserva citas, recibe confirmaciones y puede vincular Telegram para notificaciones.
- **`owner`** — dueño/administrador de una barbería. Gestiona agenda, clientes, barberos, servicios, caja y automatizaciones desde `/dashboard`.
- **`superadmin`** — equipo de VANTTAGE. Backoffice global sobre todos los tenants desde `/superadmin`.

## Guía de la aplicación

### Landing y reservas (público)

- `/` — landing comercial de NAVA.
- `/reservar` — flujo público de reservas del cliente final.
- En subdominios de tenant (p. ej. `demo.vanttage.app`), la raíz `/` redirige automáticamente a `/reservar`.

### Panel de la barbería (`owner`) — `/dashboard`

| Sección | Ruta | Qué hace |
|---|---|---|
| Dashboard | `/dashboard` | Resumen operativo del día |
| Agenda | `/dashboard/agenda` | Calendario de citas por barbero |
| Clientes | `/dashboard/clientes` | Ficha e historial de clientes |
| Barberos | `/dashboard/barberos` | Equipo y horarios (`barber_schedules`) |
| Servicios | `/dashboard/servicios` | Catálogo y categorías de servicios |
| Pagos | `/dashboard/pagos` | Registro de pagos por cita |
| Caja | `/dashboard/caja` | Control de caja diaria |
| Automatizaciones | `/dashboard/automatizaciones` | Recordatorios, reactivación, reportes |
| Configuración | `/dashboard/configuracion` | Datos de la barbería, Telegram, marca |
| Perfil | `/dashboard/perfil` | Cuenta del usuario autenticado |

### Backoffice interno (`superadmin`) — `/superadmin`

Panel global de VANTTAGE Tech sobre todos los tenants de la plataforma.

### Notificaciones

- **Email (Resend)** — recuperación de contraseña, confirmación de cambio, bienvenida al crear una barbería y reporte semanal. Plantillas en `src/lib/email.ts`, con el shell de marca NAVA (oscuro + verde esmeralda, tipografía Syne/Inter).
- **Telegram** — el cliente vincula su cuenta desde el flujo de reserva o desde configuración; a partir de ahí recibe confirmaciones y recordatorios por bot (`src/lib/telegram.ts`, `app/api/telegram/webhook`). Los horarios se muestran siempre en zona horaria de Bogotá.

### Automatizaciones (Vercel Cron)

Definidas en `src/jobs/` y expuestas como cron jobs en `vercel.json`:

- **Reactivación** (`reactivation.ts`) — lunes 10:00 a.m.
- **Reporte semanal** (`weekly-report.ts`) — lunes 8:00 a.m.
- **Recordatorios** (`reminders.ts`) — implementado, actualmente sin cron activo en `vercel.json` (se retiró temporalmente por bloquear despliegues en Vercel; ver historial de commits antes de reactivarlo).

## Arquitectura

- `app/(booking)` — experiencia del cliente final.
- `app/(admin)` — panel de la barbería.
- `app/(superadmin)` — backoffice de NAVA / VANTTAGE Tech.
- `src/components/admin` — UI reutilizable del dashboard.
- `src/lib` — infraestructura: auth, tenant, prisma, email, telegram.
- `src/jobs` — automatizaciones para Vercel Cron.
- `prisma/schema.prisma` — fuente de verdad del modelo de datos.

## Multi-tenant

La aplicación resuelve el tenant por subdominio mediante `middleware.ts` y `src/lib/tenant.ts`.

- `tenantId` identifica la cuenta SaaS.
- `barbershopId` identifica la sede operativa.
- Toda consulta operativa debe filtrar por ambos campos.

## Modelo de datos

El esquema (`prisma/schema.prisma`) cubre:

`tenants` · `barbershops` · `users` · `barbershop_memberships` · `barbers` · `service_categories` · `services` · `clients` · `appointments` · `appointment_history` · `payments` · `notifications` · `password_reset_tokens` · `barber_schedules`

La migración inicial vive en [`prisma/migrations/20260317052621_init/migration.sql`](prisma/migrations/20260317052621_init/migration.sql).

## Variables de entorno

Copia `.env.example` a `.env` y completa al menos:

| Variable | Para qué |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Conexión a PostgreSQL/Supabase (pooler y directa) |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Autenticación |
| `NEXT_PUBLIC_BASE_DOMAIN` | Dominio base para resolver subdominios de tenant |
| `VANTTAGE_DEV_TENANT` | Tenant a usar en localhost sin subdominio |
| `CRON_SECRET` | Protege `/api/cron/*` y `/api/test/*` |
| `RESEND_API_KEY` / `RESEND_FROM` | Envío de emails transaccionales |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_WEBHOOK_SECRET` / `TELEGRAM_BOT_USERNAME` | Bot de notificaciones |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (opcional; cae a memoria sin esto) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Login con Google (opcional) |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_*` | Monitoreo de errores (opcional) |

Ver `.env.example` para la lista completa y comentarios de cada una.

## Scripts

```bash
npm run dev              # servidor de desarrollo
npm run typecheck        # chequeo de tipos
npm run build            # build de producción (incluye prisma generate)
npm run validate         # typecheck + build

npm run db:generate      # genera Prisma Client
npm run db:migrate       # migración en desarrollo
npm run db:push          # push de esquema sin migración
npm run db:studio        # Prisma Studio
npm run db:seed          # datos de demo/staging
npm run db:reset         # reset completo de la base (destructivo)
npm run db:superadmin    # crea el usuario superadmin

npm run telegram:setup   # registra el webhook del bot en producción
```

## Despliegue

1. Configura PostgreSQL/Supabase y define `DATABASE_URL` / `DIRECT_URL`.
2. Carga las variables de entorno en Vercel.
3. Ejecuta las migraciones con Prisma.
4. Corre `npm run db:seed` solo en ambientes de demo o staging.
5. Despliega en Vercel.
6. Verifica que `vercel.json` tenga activos los cron jobs de reactivación y reporte semanal.
7. Si vas a usar Telegram, corre `npm run telegram:setup` después de configurar las variables del bot.

## Estado actual

- Build de producción validado con `npm run build`.
- Typecheck validado con `npx tsc --noEmit`.
- Roles autenticados oficiales: `client | owner | superadmin`.
- Rebrand a NAVA aplicado en landing, dashboard y plantillas de email.

## Nota de compatibilidad

La arquitectura original sugería `next.config.ts`, pero Next.js 14.2.29 falla en build con ese formato. Se mantiene `next.config.mjs` como excepción técnica mínima para conservar compatibilidad real de producción.

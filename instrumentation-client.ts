// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · instrumentation-client.ts
//
//  Sentry client-side init para Next.js 14+.
//  Reemplaza sentry.client.config.ts (deprecado con Turbopack).
// ─────────────────────────────────────────────────────────────────────────────

import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});

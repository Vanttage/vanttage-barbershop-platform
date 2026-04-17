// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · app/api/test/run-job/route.ts
//
//  Dispara manualmente cualquier cron job (útil para pruebas sin esperar
//  el cron schedule de Vercel).
//  Headers requeridos: Authorization: Bearer <CRON_SECRET>
//
//  GET  /api/test/run-job?job=reminders|reactivation|weekly-report
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { runReminders }      from "@/src/jobs/reminders";
import { runReactivation }   from "@/src/jobs/reactivation";
import { runWeeklyReport }   from "@/src/jobs/weekly-report";
import { isTwilioConfigured } from "@/src/lib/whatsapp";

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

const VALID_JOBS = ["reminders", "reactivation", "weekly-report"] as const;
type JobName = (typeof VALID_JOBS)[number];

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const job = searchParams.get("job") as JobName | null;

  // ── Sin parámetro: devuelve estado del sistema ────────────────────────────

  if (!job) {
    return NextResponse.json({
      message: "Pasa ?job=<nombre> para ejecutar un job",
      available_jobs: VALID_JOBS,
      system_status: {
        twilio:   isTwilioConfigured(),
        resend:   Boolean(process.env.RESEND_API_KEY),
        upstash:  Boolean(process.env.UPSTASH_REDIS_REST_URL),
        sentry:   Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
        node_env: process.env.NODE_ENV,
      },
    });
  }

  if (!VALID_JOBS.includes(job)) {
    return NextResponse.json(
      { error: `Job inválido. Opciones: ${VALID_JOBS.join(", ")}` },
      { status: 400 },
    );
  }

  // ── Ejecuta el job ────────────────────────────────────────────────────────

  const startMs = Date.now();

  try {
    let result: unknown;

    switch (job) {
      case "reminders":
        result = await runReminders();
        break;
      case "reactivation":
        result = await runReactivation();
        break;
      case "weekly-report":
        result = await runWeeklyReport();
        break;
    }

    return NextResponse.json({
      ok:         true,
      job,
      result,
      duration_ms: Date.now() - startMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[test/run-job] Error en job "${job}":`, err);
    return NextResponse.json(
      { ok: false, job, error: message, duration_ms: Date.now() - startMs },
      { status: 500 },
    );
  }
}

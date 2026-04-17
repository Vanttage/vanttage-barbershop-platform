// src/app/api/cron/reminders/route.ts
// Vercel Cron llama este endpoint cada hora: "0 * * * *"

import { NextRequest, NextResponse } from "next/server";
import { runReminders } from "@/src/jobs/reminders";

export async function GET(request: NextRequest) {
  // Verifica que la llamada viene de Vercel Cron (seguridad básica)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await runReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/reminders]", err);
    return NextResponse.json({ error: "Error en el cron" }, { status: 500 });
  }
}

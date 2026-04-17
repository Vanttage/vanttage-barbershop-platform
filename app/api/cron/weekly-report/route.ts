// src/app/api/cron/weekly-report/route.ts
// Vercel Cron llama este endpoint los lunes a las 8am: "0 8 * * 1"

import { NextRequest, NextResponse } from "next/server";
import { runWeeklyReport } from "@/src/jobs/weekly-report";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await runWeeklyReport();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/weekly-report]", err);
    return NextResponse.json({ error: "Error en el cron" }, { status: 500 });
  }
}

// src/app/api/cron/reactivation/route.ts
// Vercel Cron llama este endpoint los lunes a las 10am: "0 10 * * 1"

import { NextRequest, NextResponse } from "next/server";
import { runReactivation } from "@/src/jobs/reactivation";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await runReactivation();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/reactivation]", err);
    return NextResponse.json({ error: "Error en el cron" }, { status: 500 });
  }
}

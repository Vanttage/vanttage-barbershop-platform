"use client";

import { DollarSign, CalendarDays, Users, Activity } from "lucide-react";
import { useApi } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import type { DashboardStats } from "@/src/types";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  accent?: boolean;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatCard({ label, value, delta, deltaLabel, accent, icon, loading }: StatCardProps) {
  const positive = delta !== undefined && delta >= 0;
  return (
    <div
      className={[
        "flex cursor-default flex-col gap-3 rounded-xl border p-5 transition-all duration-200 hover:-translate-y-px",
        accent
          ? "border-gold/20 bg-gradient-to-br from-gold/10 to-gold/[0.03] hover:border-gold/40"
          : "border-white/[0.04] bg-[#111113] hover:border-white/[0.08]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-500">
          {label}
        </span>
        <span className={`opacity-60 ${accent ? "text-gold" : "text-zinc-500"}`}>
          {icon}
        </span>
      </div>

      {loading ? (
        <div className="h-7 w-32 animate-pulse rounded bg-zinc-800/60" />
      ) : (
        <div
          className={[
            "leading-none",
            accent
              ? "font-display text-[26px] font-semibold text-gold-light"
              : "text-[23px] font-medium text-zinc-100",
          ].join(" ")}
        >
          {value}
        </div>
      )}

      {delta !== undefined && !loading && (
        <div className="flex items-center gap-1.5">
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
              positive ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400",
            ].join(" ")}
          >
            {positive ? "+" : ""}{delta}%
          </span>
          {deltaLabel && <span className="text-[11px] text-zinc-600">{deltaLabel}</span>}
        </div>
      )}

      {delta === undefined && deltaLabel && !loading && (
        <span className="text-[11px] text-zinc-600">{deltaLabel}</span>
      )}
    </div>
  );
}

export default function StatsCards() {
  const { data, loading } = useApi<DashboardStats>("/api/dashboard");

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Ingresos del mes"
        value={data ? formatCOP(data.ingresosMes) : "$0"}
        delta={data?.ingresosMonthDelta}
        deltaLabel="vs. mes anterior"
        accent
        icon={<DollarSign size={17} />}
        loading={loading}
      />
      <StatCard
        label="Citas hoy"
        value={data ? String(data.citasHoy) : "0"}
        delta={data?.citasHoyDelta}
        deltaLabel="vs. ayer"
        icon={<CalendarDays size={17} />}
        loading={loading}
      />
      <StatCard
        label="Clientes activos"
        value={data ? String(data.clientesActivos) : "0"}
        deltaLabel={data ? `+${data.clientesNuevos} nuevos este mes` : ""}
        icon={<Users size={17} />}
        loading={loading}
      />
      <StatCard
        label="Tasa de asistencia"
        value={data ? `${data.tasaAsistencia}%` : "0%"}
        delta={data ? data.tasaAsistencia - 80 : undefined}
        deltaLabel="vs. promedio"
        icon={<Activity size={17} />}
        loading={loading}
      />
    </div>
  );
}

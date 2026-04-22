"use client";

import { DollarSign, CalendarDays, Users, Activity } from "lucide-react";
import { useApi } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import type { DashboardStats } from "@/src/types";
import { useEffect, useState } from "react";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  accent?: boolean;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  accent,
  icon,
  loading,
}: StatCardProps) {
  const positive = delta !== undefined && delta >= 0;

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[22px] border p-4 sm:p-5",
        "transition-all duration-200",
        "hover:-translate-y-[2px] hover:shadow-[0_14px_40px_rgba(0,0,0,0.35)]",
        accent
          ? "border-emerald-400/25 bg-gradient-to-br from-emerald-400/[0.12] to-emerald-400/[0.03]"
          : "border-white/[0.06] bg-white/[0.035]",
      ].join(" ")}
    >
      {/* glow */}
      <div
        className={[
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          accent
            ? "bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.18),transparent_45%)]"
            : "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]",
        ].join(" ")}
      />

      {/* header */}
      <div className="relative flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </span>
        <span
          className={[
            "flex h-8 w-8 items-center justify-center rounded-full border",
            accent
              ? "border-emerald-400/30 bg-emerald-400/[0.12] text-emerald-300"
              : "border-white/[0.08] bg-black/20 text-zinc-400",
          ].join(" ")}
        >
          {icon}
        </span>
      </div>

      {/* value */}
      <div className="relative mt-3">
        {loading ? (
          <div className="h-7 w-28 animate-pulse rounded-md bg-white/[0.08]" />
        ) : (
          <div
            className={[
              "leading-none tracking-[-0.02em]",
              accent
                ? "text-[26px] font-semibold text-emerald-300"
                : "text-[24px] font-medium text-zinc-100",
            ].join(" ")}
          >
            {value}
          </div>
        )}
      </div>

      {/* delta */}
      <div className="relative mt-3 min-h-[22px]">
        {delta !== undefined && !loading && (
          <div className="flex items-center gap-2">
            <span
              className={[
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                positive
                  ? "bg-emerald-400/15 text-emerald-400"
                  : "bg-red-400/15 text-red-400",
              ].join(" ")}
            >
              {positive ? "+" : ""}
              {delta}%
            </span>
            {deltaLabel && (
              <span className="text-[11px] text-zinc-500">{deltaLabel}</span>
            )}
          </div>
        )}

        {delta === undefined && deltaLabel && !loading && (
          <span className="text-[11px] text-zinc-500">{deltaLabel}</span>
        )}
      </div>
    </div>
  );
}

export default function StatsCards() {
  const { data, loading } = useApi<DashboardStats>("/api/dashboard");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // evita hydration mismatch
  if (!mounted) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[120px] rounded-[22px] border border-white/[0.06] bg-white/[0.03] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        label="Ingresos del mes"
        value={data ? formatCOP(data.ingresosMes) : "$0"}
        delta={data?.ingresosMonthDelta}
        deltaLabel="vs. mes anterior"
        accent
        icon={<DollarSign size={16} />}
        loading={loading}
      />

      <StatCard
        label="Citas hoy"
        value={data ? String(data.citasHoy) : "0"}
        delta={data?.citasHoyDelta}
        deltaLabel="vs. ayer"
        icon={<CalendarDays size={16} />}
        loading={loading}
      />

      <StatCard
        label="Clientes activos"
        value={data ? String(data.clientesActivos) : "0"}
        deltaLabel={data ? `+${data.clientesNuevos} nuevos este mes` : ""}
        icon={<Users size={16} />}
        loading={loading}
      />

      <StatCard
        label="Tasa de asistencia"
        value={data ? `${data.tasaAsistencia}%` : "0%"}
        delta={data ? data.tasaAsistencia - 80 : undefined}
        deltaLabel="vs. promedio"
        icon={<Activity size={16} />}
        loading={loading}
      />
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { useApi } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import type { DashboardStats } from "@/src/types";

type Mode = "citas" | "ingresos";

export default function WeeklyChart() {
  const [mode, setMode] = useState<Mode>("citas");
  const [hovered, setHovered] = useState<number | null>(null);
  const { data, loading } = useApi<DashboardStats>("/api/dashboard");

  const weeklyData = data?.weeklyData ?? [];

  const maxVal = useMemo(
    () =>
      weeklyData.length
        ? Math.max(
            ...weeklyData.map((d) => (mode === "citas" ? d.citas : d.ingresos)),
            1,
          )
        : 1,
    [weeklyData, mode],
  );

  const totalWeek = useMemo(
    () =>
      weeklyData.reduce(
        (a, d) => a + (mode === "citas" ? d.citas : d.ingresos),
        0,
      ),
    [weeklyData, mode],
  );

  const bestDay = useMemo(() => {
    if (!weeklyData.length) return null;
    const best = weeklyData.reduce((b, d) =>
      (mode === "citas" ? d.citas : d.ingresos) >
      (mode === "citas" ? b.citas : b.ingresos)
        ? d
        : b,
    );
    // Solo mostrar si el mejor día tiene valor real > 0
    const bestVal = mode === "citas" ? best.citas : best.ingresos;
    return bestVal > 0 ? best : null;
  }, [weeklyData, mode]);

  const formatVal = (v: number) =>
    mode === "ingresos" ? formatCOP(v) : `${v} citas`;

  return (
    <section className="rounded-[26px] border border-white/[0.06] bg-white/[0.035] p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-zinc-100">
            Resumen semanal
          </h3>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Lunes — Domingo · semana actual
          </p>
        </div>

        <div className="flex rounded-xl border border-white/[0.08] bg-black/30 p-0.5">
          {(["ingresos", "citas"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={[
                "rounded-lg px-3 py-1.5 text-[11.5px] capitalize transition-all",
                mode === m
                  ? "bg-white/[0.08] font-medium text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300",
              ].join(" ")}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5 flex gap-6 border-b border-white/[0.06] pb-5">
        <div>
          <div className="mb-1 text-[10px] tracking-[0.14em] text-zinc-500">
            TOTAL SEMANA
          </div>
          {loading ? (
            <div className="h-6 w-28 rounded bg-white/[0.08] animate-pulse" />
          ) : (
            <div className="text-[21px] font-semibold tracking-[-0.02em] text-emerald-300">
              {formatVal(totalWeek)}
            </div>
          )}
        </div>

        {bestDay && !loading && (
          <div className="border-l border-white/[0.06] pl-6">
            <div className="mb-1 text-[10px] tracking-[0.14em] text-zinc-500">
              MEJOR DÍA
            </div>
            <div className="text-[14px] font-medium text-zinc-200">
              {bestDay.day} ·{" "}
              {formatVal(mode === "citas" ? bestDay.citas : bestDay.ingresos)}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex h-44 items-end gap-2">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-1 flex-col items-center justify-end gap-2"
              >
                <div
                  className="w-full rounded-md bg-white/[0.08] animate-pulse"
                  style={{ height: `${30 + ((i * 13) % 50)}%` }}
                />
                <div className="h-3 w-6 rounded bg-white/[0.06] animate-pulse" />
              </div>
            ))
          : weeklyData.map((d, i) => {
              const val = mode === "citas" ? d.citas : d.ingresos;
              const pct = (val / maxVal) * 100;
              const isBest = bestDay?.day === d.day;
              const isHov = hovered === i;

              return (
                <div
                  key={d.day}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="group relative flex flex-1 cursor-pointer flex-col items-center justify-end gap-2"
                >
                  {/* Tooltip */}
                  {isHov && val > 0 && (
                    <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg border border-white/[0.10] bg-zinc-900/95 px-2.5 py-1.5 shadow-xl">
                      <p className="text-center text-[11px] font-semibold text-zinc-100">
                        {formatVal(val)}
                      </p>
                      <p className="text-center text-[10px] text-zinc-500">{d.day}</p>
                    </div>
                  )}

                  <div className="flex h-full w-full items-end">
                    <div
                      className={[
                        "w-full rounded-md transition-all duration-200",
                        isBest
                          ? "bg-gradient-to-b from-emerald-400 to-emerald-600"
                          : isHov
                            ? "bg-white/[0.22]"
                            : "bg-white/[0.10]",
                      ].join(" ")}
                      style={{ height: `${Math.max(pct, 6)}%` }}
                    />
                  </div>
                  <span
                    className={[
                      "text-[10.5px]",
                      isBest ? "font-medium text-emerald-300" : isHov ? "text-zinc-300" : "text-zinc-500",
                    ].join(" ")}
                  >
                    {d.day}
                  </span>
                </div>
              );
            })}
      </div>
    </section>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { useApi } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import type { DashboardStats } from "@/src/types";

type Mode = "citas" | "ingresos";

export default function WeeklyChart() {
  const [mode, setMode] = useState<Mode>("ingresos");
  const [hovered, setHovered] = useState<number | null>(null);
  const { data, loading } = useApi<DashboardStats>("/api/dashboard");

  const weeklyData = data?.weeklyData ?? [];

  // useMemo: solo recalcula cuando weeklyData o mode cambian
  const maxVal = useMemo(
    () =>
      weeklyData.length
        ? Math.max(...weeklyData.map((d) => (mode === "citas" ? d.citas : d.ingresos)), 1)
        : 1,
    [weeklyData, mode],
  );

  const totalWeek = useMemo(
    () => weeklyData.reduce((a, d) => a + (mode === "citas" ? d.citas : d.ingresos), 0),
    [weeklyData, mode],
  );

  const bestDay = useMemo(
    () =>
      weeklyData.length
        ? weeklyData.reduce((b, d) =>
            (mode === "citas" ? d.citas : d.ingresos) >
            (mode === "citas" ? b.citas : b.ingresos)
              ? d
              : b,
          )
        : null,
    [weeklyData, mode],
  );

  const formatVal = (v: number) =>
    mode === "ingresos" ? formatCOP(v) : `${v} citas`;

  return (
    <div className="bg-[#111113] border border-white/[0.04] rounded-xl p-6">
      <div className="flex justify-between items-start mb-5 flex-wrap gap-3">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-zinc-100">
            Resumen semanal
          </h3>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            Lunes — Domingo · semana actual
          </p>
        </div>
        <div className="flex bg-zinc-800/60 border border-white/[0.04] rounded-lg p-0.5 gap-0.5">
          {(["ingresos", "citas"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-md text-[11.5px] capitalize transition-all ${mode === m ? "bg-zinc-700 border border-white/[0.08] text-gold-light font-medium" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6 mb-5 pb-5 border-b border-white/[0.04]">
        <div>
          <div className="text-[10px] text-zinc-600 tracking-[0.05em] mb-1">
            TOTAL SEMANA
          </div>
          {loading ? (
            <div className="h-6 w-28 bg-zinc-800/60 rounded animate-pulse" />
          ) : (
            <div className="font-display text-[21px] font-semibold text-gold-light">
              {formatVal(totalWeek)}
            </div>
          )}
        </div>
        {bestDay && !loading && (
          <div className="border-l border-white/[0.04] pl-6">
            <div className="text-[10px] text-zinc-600 tracking-[0.05em] mb-1">
              MEJOR DÍA
            </div>
            <div className="text-[15px] font-medium text-zinc-200">
              {bestDay.day} ·{" "}
              {formatVal(mode === "citas" ? bestDay.citas : bestDay.ingresos)}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 h-36">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
              >
                <div
                  className="w-full rounded-t bg-zinc-800/60 animate-pulse"
                  style={{ height: `${30 + ((i * 17) % 50)}%` }}
                />
                <div className="h-3 w-6 bg-zinc-800/60 rounded animate-pulse" />
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
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className="w-full flex items-end"
                    style={{ height: "100%" }}
                  >
                    <div
                      className={`w-full rounded-t-[3px] border transition-all duration-200 ${
                        isBest
                          ? "bg-gradient-to-b from-gold-light to-[#8B6B2E] border-gold"
                          : isHov
                            ? "bg-zinc-700 border-white/[0.08]"
                            : "bg-zinc-800/60 border-white/[0.04]"
                      }`}
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10.5px] ${isBest ? "text-gold font-medium" : "text-zinc-600"}`}
                  >
                    {d.day}
                  </span>
                </div>
              );
            })}
      </div>
    </div>
  );
}

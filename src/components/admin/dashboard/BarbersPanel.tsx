"use client";

import { useApiList } from "@/src/hooks/useApi";
import { getInitials } from "@/src/types";

type BarberPanelItem = {
  id: string;
  name: string;
  specialty: string | null;
  active: boolean;
  rating: number;
  appointmentsToday: number;
  favoriteCount: number;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <span
          key={value}
          className={
            value <= Math.round(rating) ? "text-amber-400" : "text-zinc-700"
          }
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-[11px] text-zinc-500">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export default function BarbersPanel() {
  const { data: barbers, loading } = useApiList<BarberPanelItem>(
    "/api/barbers?active=true",
  );

  const activeCount = barbers.filter((b) => b.active).length;

  return (
    <section className="rounded-[26px] border border-white/[0.06] bg-white/[0.035] p-4 sm:p-5">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-zinc-100">
            Equipo
          </h3>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {activeCount} barberos activos
          </p>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[150px] rounded-2xl border border-white/[0.06] bg-white/[0.03] animate-pulse"
              />
            ))
          : barbers.map((barber) => (
              <div
                key={barber.id}
                className="group rounded-2xl border border-white/[0.06] bg-black/30 p-4 transition-all duration-200 hover:-translate-y-[1px] hover:border-white/[0.12] hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
              >
                {/* Top */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-semibold text-black">
                    {getInitials(barber.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {barber.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                      {barber.specialty ?? "Especialidad por configurar"}
                    </p>
                  </div>

                  <span
                    className={[
                      "h-2.5 w-2.5 rounded-full",
                      barber.active ? "bg-emerald-400" : "bg-zinc-600",
                    ].join(" ")}
                  />
                </div>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Citas hoy
                    </p>
                    <p className="mt-1 text-lg font-semibold text-zinc-100">
                      {barber.appointmentsToday}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Favoritos
                    </p>
                    <p className="mt-1 text-lg font-semibold text-zinc-100">
                      {barber.favoriteCount}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Estado
                    </p>
                    <p
                      className={[
                        "mt-1 text-sm font-semibold",
                        barber.active ? "text-emerald-400" : "text-zinc-500",
                      ].join(" ")}
                    >
                      {barber.active ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div className="mt-4 flex items-center justify-between">
                  <Stars rating={barber.rating} />
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}

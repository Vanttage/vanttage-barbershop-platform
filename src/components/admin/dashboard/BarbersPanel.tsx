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
          className={value <= Math.round(rating) ? "text-gold" : "text-zinc-700"}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-[11px] text-zinc-500">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function BarbersPanel() {
  const { data: barbers, loading } =
    useApiList<BarberPanelItem>("/api/barbers?active=true");

  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#111113] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-zinc-100">Equipo</h3>
          <p className="mt-0.5 text-[11px] text-zinc-600">
            {barbers.filter((barber) => barber.active).length} barberos activos
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-36 rounded-xl border border-white/[0.04] bg-zinc-800/30 animate-pulse"
              />
            ))
          : barbers.map((barber) => (
              <div
                key={barber.id}
                className="rounded-xl border border-white/[0.04] bg-zinc-800/40 p-4 transition hover:border-white/[0.08]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-b bg-[#8B6B2E] text-sm font-semibold text-gold-light">
                    {getInitials(barber.name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-100">
                      {barber.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {barber.specialty ?? "Especialidad por configurar"}
                    </p>
                  </div>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      barber.active ? "bg-emerald-400" : "bg-zinc-600"
                    }`}
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ["Citas hoy", barber.appointmentsToday],
                    ["Favoritos", barber.favoriteCount],
                    ["Estado", barber.active ? "On" : "Off"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-white/[0.04] bg-[#111113] px-3 py-2 text-center"
                    >
                      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-200">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Stars rating={barber.rating} />
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

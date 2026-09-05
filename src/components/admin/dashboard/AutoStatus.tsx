"use client";

import { useApi } from "@/src/hooks/useApi";

interface AutomationConfig {
  autoConfirmacion: boolean;
  autoReminder24h: boolean;
  autoReminder1h: boolean;
  autoReactivacion: boolean;
}

const ITEMS: { key: keyof AutomationConfig; label: string }[] = [
  { key: "autoConfirmacion", label: "Confirmación de cita" },
  { key: "autoReminder24h", label: "Recordatorio 24h" },
  { key: "autoReminder1h", label: "Recordatorio 1h" },
  { key: "autoReactivacion", label: "Reactivación clientes" },
];

export default function AutoStatus() {
  const { data: config, loading } = useApi<AutomationConfig>("/api/automations");

  const activeCount = config ? ITEMS.filter((item) => config[item.key]).length : 0;

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.025)_100%)] backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_24px_70px_rgba(0,0,0,0.30)]">
      <div className="flex h-full flex-col gap-5 p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Automatizaciones
            </p>

            <div className="space-y-1">
              <h2 className="text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">
                Operación automatizada y bajo control
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                Un vistazo rápido al estado de confirmaciones, recordatorios y
                reactivación por Telegram.
              </p>
            </div>
          </div>

          {!loading && (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3.5 py-1.5 text-[12px] font-medium text-emerald-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/35" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              {activeCount} activas
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {loading || !config
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="min-h-[78px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]"
                />
              ))
            : ITEMS.map((item) => {
                const on = config[item.key];
                return (
                  <div
                    key={item.key}
                    className={[
                      "group flex min-h-[78px] items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200",
                      on
                        ? "border-emerald-400/18 bg-emerald-400/[0.05] hover:bg-emerald-400/[0.07]"
                        : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.045]",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium tracking-[-0.02em] text-white">
                        {item.label}
                      </p>
                      <p className="mt-1 text-[12px] text-zinc-500">
                        {on ? "Activo y funcionando" : "Disponible para activar"}
                      </p>
                    </div>

                    <div
                      className={[
                        "inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
                        on
                          ? "border-emerald-400/20 bg-emerald-400/[0.10] text-emerald-300"
                          : "border-white/[0.08] bg-black/20 text-zinc-500",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "h-1.5 w-1.5 rounded-full",
                          on ? "bg-emerald-400" : "bg-zinc-600",
                        ].join(" ")}
                      />
                      {on ? "On" : "Off"}
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}

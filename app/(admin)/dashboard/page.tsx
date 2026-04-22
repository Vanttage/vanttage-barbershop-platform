import React from "react";
import dynamic from "next/dynamic";
import { Plus_Jakarta_Sans } from "next/font/google";
import AppointmentsList from "@/src/components/admin/dashboard/AppointmentsList";
import BarbersPanel from "@/src/components/admin/dashboard/BarbersPanel";
import Header from "@/src/components/admin/dashboard/Header";
import StatsCards from "@/src/components/admin/dashboard/StatsCards";
import WeeklyChart from "@/src/components/admin/dashboard/WeeklyChart";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

// Loaded purely client-side to avoid RSC module-graph issues
const BookingLinkCard = dynamic(
  () => import("@/src/components/admin/dashboard/BookingLinkCard"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[188px] rounded-[28px] border border-white/[0.08] bg-white/[0.03] shadow-[0_20px_60px_rgba(0,0,0,0.28)] animate-pulse" />
    ),
  },
);

export const metadata = { title: "Dashboard · VANTTAGE" };

const AUTO_ITEMS = [
  { label: "WhatsApp confirmaciones", on: true },
  { label: "Recordatorio 24h", on: true },
  { label: "Recordatorio 1h", on: true },
  { label: "Reseñas automáticas", on: true },
  { label: "Reactivación clientes", on: false },
];

const ACTIVE_COUNT = AUTO_ITEMS.filter((item) => item.on).length;

function AutoStatus() {
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
                reactivación. Más limpio en móvil y con un look más ejecutivo en
                desktop.
              </p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3.5 py-1.5 text-[12px] font-medium text-emerald-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/35" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            {ACTIVE_COUNT} activas
          </div>
        </div>

        {/* NOTA: Ajusté también los grid-cols para que coincidan con la etiqueta que se te había colado */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {AUTO_ITEMS.map((item) => (
            <div
              key={item.label}
              className={[
                "group flex min-h-[78px] items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200",
                item.on
                  ? "border-emerald-400/18 bg-emerald-400/[0.05] hover:bg-emerald-400/[0.07]"
                  : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.045]",
              ].join(" ")}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium tracking-[-0.02em] text-white">
                  {item.label}
                </p>
                <p className="mt-1 text-[12px] text-zinc-500">
                  {item.on ? "Activo y funcionando" : "Disponible para activar"}
                </p>
              </div>

              <div
                className={[
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
                  item.on
                    ? "border-emerald-400/20 bg-emerald-400/[0.10] text-emerald-300"
                    : "border-white/[0.08] bg-black/20 text-zinc-500",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    item.on ? "bg-emerald-400" : "bg-zinc-600",
                  ].join(" ")}
                />
                {item.on ? "On" : "Off"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <div
      className={`${plusJakarta.className} relative isolate min-h-screen bg-[#09090B] text-white`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.055),transparent_34%)]" />
        <div className="absolute left-[-10%] top-[-8%] h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/[0.08] blur-3xl" />
        <div className="absolute bottom-[-12%] right-[-10%] h-[26rem] w-[26rem] rounded-full bg-cyan-500/[0.06] blur-3xl" />
      </div>

      <div className="flex min-h-screen flex-col">
        <Header title="Dashboard" />

        <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-3 pb-10 pt-4 sm:gap-5 sm:px-5 sm:pt-6 lg:gap-6 lg:px-8 lg:pt-8 2xl:px-10">
          <div className="min-w-0">
            <BookingLinkCard />
          </div>

          <div className="min-w-0">
            <AutoStatus />
          </div>

          <div className="min-w-0">
            <StatsCards />
          </div>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_340px] 2xl:grid-cols-[minmax(0,1.35fr)_360px]">
            <div className="min-w-0">
              <WeeklyChart />
            </div>

            <div className="min-w-0">
              <BarbersPanel />
            </div>
          </section>

          <div className="min-w-0">
            <AppointmentsList />
          </div>
        </main>
      </div>
    </div>
  );
}

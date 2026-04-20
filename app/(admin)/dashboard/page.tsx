import React from "react";
import dynamic from "next/dynamic";
import AppointmentsList from "@/src/components/admin/dashboard/AppointmentsList";
import BarbersPanel from "@/src/components/admin/dashboard/BarbersPanel";
import Header from "@/src/components/admin/dashboard/Header";
import StatsCards from "@/src/components/admin/dashboard/StatsCards";
import WeeklyChart from "@/src/components/admin/dashboard/WeeklyChart";

// Loaded purely client-side to avoid RSC module-graph issues
const BookingLinkCard = dynamic(
  () => import("@/src/components/admin/dashboard/BookingLinkCard"),
  { ssr: false },
);

export const metadata = { title: "Dashboard · VANTTAGE" };

const AUTO_ITEMS = [
  { label: "WhatsApp confirmaciones", on: true },
  { label: "Recordatorio 24h", on: true },
  { label: "Recordatorio 1h", on: true },
  { label: "Reseñas automáticas", on: true },
  { label: "Reactivación clientes", on: false },
];

function AutoStatus() {
  return (
    <div className="bg-[#111113] border border-white/[0.04] rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap sm:px-5 sm:py-3.5 sm:gap-4">
      <span className="text-[11px] text-zinc-600 font-medium tracking-[0.06em] uppercase whitespace-nowrap">
        Automatizaciones
      </span>
      <div className="flex flex-wrap gap-2">
        {AUTO_ITEMS.map((item) => (
          <span
            key={item.label}
            className={`
              inline-flex items-center gap-1.5 text-[11.5px] font-medium
              px-3 py-1 rounded-full border
              ${
                item.on
                  ? "bg-emerald-400/[0.08] text-emerald-400 border-emerald-400/20"
                  : "bg-zinc-800/60 text-zinc-500 border-white/[0.04]"
              }
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.on ? "bg-emerald-400" : "bg-zinc-600"}`}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-zinc-950">
      <Header title="Dashboard" />
      <main className="flex-1 px-4 py-5 pb-10 flex flex-col gap-4 max-w-[1440px] w-full mx-auto sm:px-6 sm:py-7 sm:gap-5">
        <BookingLinkCard />
        <AutoStatus />
        <StatsCards />
        <div className="grid grid-cols-1 gap-4 items-start sm:gap-5 xl:grid-cols-[1fr_300px]">
          <WeeklyChart />
          <BarbersPanel />
        </div>
        <AppointmentsList />
      </main>
    </div>
  );
}

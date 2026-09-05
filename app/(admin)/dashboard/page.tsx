import React from "react";
import dynamic from "next/dynamic";
import { Plus_Jakarta_Sans } from "next/font/google";
import AppointmentsList from "@/src/components/admin/dashboard/AppointmentsList";
import AutoStatus from "@/src/components/admin/dashboard/AutoStatus";
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

export const metadata = { title: "Dashboard · NAVA" };

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

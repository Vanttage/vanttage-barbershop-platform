"use client";

import { Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSidebar } from "./DashboardShell";
import UserMenu from "@/src/components/admin/ui/UserMenu";

export default function Header({ title = "Dashboard" }: { title?: string }) {
  const { toggle, shop } = useSidebar();
  const { data: session } = useSession();
  const isSuperadmin = session?.user.role === "superadmin";

  const today = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 h-[64px] border-b border-white/[0.06] bg-[#0B0B0E]/90 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label="Abrir menú"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-[19px] font-semibold tracking-[-0.02em] text-zinc-100 sm:text-[21px]">
              {title}
            </h1>
            <p className="hidden text-[11.5px] capitalize text-zinc-500 sm:block">
              {today}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-shrink-0 items-center gap-3">
          {!isSuperadmin && shop?.barbershopName && (
            <div className="hidden rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 md:block">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Operando en
              </p>
              <p className="mt-0.5 max-w-[160px] truncate text-[12.5px] font-medium text-zinc-200">
                {shop.barbershopName}
              </p>
            </div>
          )}

          <UserMenu />
        </div>
      </div>
    </header>
  );
}

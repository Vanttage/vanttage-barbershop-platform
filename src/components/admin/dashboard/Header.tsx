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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.05] bg-[#0e0e10]/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left — hamburger + title */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="Abrir menú"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200 lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate font-display text-[18px] font-bold text-zinc-100 sm:text-[20px]">
            {title}
          </h1>
          <p className="hidden text-[11px] capitalize text-zinc-600 sm:block">{today}</p>
        </div>
      </div>

      {/* Right — barbershop chip + user menu */}
      <div className="flex flex-shrink-0 items-center gap-2.5">
        {/* ── shop viene del contexto — SIN fetch propio ─────────── */}
        {!isSuperadmin && shop?.barbershopName && (
          <div className="hidden rounded-lg border border-white/[0.06] bg-zinc-900/60 px-3 py-1.5 md:block">
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
              Operando en
            </p>
            <p className="mt-0.5 max-w-[150px] truncate text-[12px] font-medium text-zinc-200">
              {shop.barbershopName}
            </p>
          </div>
        )}
        <UserMenu />
      </div>
    </header>
  );
}

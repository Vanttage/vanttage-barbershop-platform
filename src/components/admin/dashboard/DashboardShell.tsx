"use client";

import { createContext, useContext, useState } from "react";
import { useApi } from "@/src/hooks/useApi";
import type { PublicBarbershop } from "@/src/types";

interface SidebarCtx {
  mobileOpen: boolean;
  toggle: () => void;
  close: () => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  // Datos del barbershop — fetch centralizado aquí, no en cada componente hijo
  shop: PublicBarbershop | null;
  shopLoading: boolean;
}

const SidebarContext = createContext<SidebarCtx>({
  mobileOpen: false,
  toggle: () => {},
  close: () => {},
  collapsed: false,
  setCollapsed: () => {},
  shop: null,
  shopLoading: true,
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // ── Un solo fetch para todo el layout ─────────────────────────────────────
  // Antes: Sidebar + Header llamaban /api/public/barbershop por separado.
  // Ahora: se llama UNA sola vez aquí y se comparte via contexto.
  const { data: shop, loading: shopLoading } = useApi<PublicBarbershop>(
    "/api/public/barbershop",
  );

  return (
    <SidebarContext.Provider
      value={{
        mobileOpen,
        toggle:      () => setMobileOpen((o) => !o),
        close:       () => setMobileOpen(false),
        collapsed,
        setCollapsed,
        shop:        shop ?? null,
        shopLoading,
      }}
    >
      <div className="relative flex min-h-screen bg-zinc-950">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Desktop spacer — mirrors sidebar width in the flex flow */}
        <div
          className={[
            "hidden lg:block flex-shrink-0 transition-all duration-300",
            collapsed ? "w-14" : "w-60",
          ].join(" ")}
        />

        {children}
      </div>
    </SidebarContext.Provider>
  );
}

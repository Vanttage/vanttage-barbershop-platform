"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  Layers,
  CreditCard,
  Zap,
  Settings,
  Shield,
  ChevronLeft,
  X,
} from "lucide-react";
import { useSidebar } from "./DashboardShell";

const ownerNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
  { label: "Clientes", href: "/dashboard/clientes", icon: Users },
  { label: "Barberos", href: "/dashboard/barberos", icon: Scissors },
  { label: "Servicios", href: "/dashboard/servicios", icon: Layers },
  { label: "Pagos", href: "/dashboard/pagos", icon: CreditCard },
  { label: "Automatizaciones", href: "/dashboard/automatizaciones", icon: Zap },
  { label: "Configuración", href: "/dashboard/configuracion", icon: Settings },
];

const superadminNavItems = [
  { label: "Panel Global", href: "/superadmin", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { mobileOpen, close, collapsed, setCollapsed, shop } = useSidebar();

  const isSuperadmin = session?.user.role === "superadmin";
  const items = isSuperadmin ? superadminNavItems : ownerNavItems;

  const sidebarW = collapsed ? "w-[64px]" : "w-[240px]";

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 flex flex-col",
        "border-r border-white/[0.06] bg-[#0B0B0E]",
        "transition-all duration-300 ease-in-out",
        sidebarW,
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
      ].join(" ")}
    >
      {/* Brand */}
      <div
        className={[
          "flex h-[64px] items-center border-b border-white/[0.06] transition-all duration-300",
          collapsed ? "justify-center" : "justify-between px-4",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-center gap-3 min-w-0 transition-all duration-300",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          {/* LOGO */}
          <img
            src="/logo.svg"
            alt="Vanttage"
            className="h-8 w-8 shrink-0 object-contain"
          />

          {/* TEXTO */}
          <div
            className={[
              "overflow-hidden transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            ].join(" ")}
          >
            <p
              className="whitespace-nowrap font-display text-transparent bg-clip-text"
              style={{
                background: "linear-gradient(90deg, #1EA7FF, #D4AF37)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.14em",
              }}
            >
              VANTTAGE
            </p>
            <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {isSuperadmin
                ? "Super Admin"
                : (shop?.barbershopName ?? "Barbería")}
            </p>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200 lg:flex"
        >
          <ChevronLeft
            size={16}
            className={[
              "transition-transform duration-300",
              collapsed ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>

        {/* Mobile close */}
        <button
          onClick={close}
          className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200 lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isExact =
            item.href === "/dashboard" || item.href === "/superadmin";
          const active = isExact
            ? pathname === item.href
            : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              title={collapsed ? item.label : undefined}
              className={[
                "group flex items-center rounded-xl border transition-all duration-150",
                collapsed ? "h-11 justify-center" : "gap-3 px-4 py-3",
                active
                  ? "border-emerald-400/30 bg-emerald-400/[0.12] text-emerald-300"
                  : "border-transparent text-zinc-400 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-zinc-200",
              ].join(" ")}
            >
              <Icon
                size={20}
                className={[
                  "shrink-0 transition-colors",
                  active ? "text-emerald-300" : "text-zinc-400",
                ].join(" ")}
              />

              {!collapsed && (
                <span className="truncate text-[14px] font-medium">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
``;

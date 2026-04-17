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
  { label: "Dashboard",        href: "/dashboard",                  icon: LayoutDashboard },
  { label: "Agenda",           href: "/dashboard/agenda",           icon: CalendarDays    },
  { label: "Clientes",         href: "/dashboard/clientes",         icon: Users           },
  { label: "Barberos",         href: "/dashboard/barberos",         icon: Scissors        },
  { label: "Servicios",        href: "/dashboard/servicios",        icon: Layers          },
  { label: "Pagos",            href: "/dashboard/pagos",            icon: CreditCard      },
  { label: "Automatizaciones", href: "/dashboard/automatizaciones", icon: Zap             },
  { label: "Configuración",    href: "/dashboard/configuracion",    icon: Settings        },
];

const superadminNavItems = [
  { label: "Panel Global", href: "/superadmin", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  // ── shop viene del contexto — SIN fetch propio ───────────────────────────
  const { mobileOpen, close, collapsed, setCollapsed, shop } = useSidebar();

  const isSuperadmin = session?.user.role === "superadmin";
  const items = isSuperadmin ? superadminNavItems : ownerNavItems;

  const sidebarW = collapsed ? "w-14" : "w-60";

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 flex flex-shrink-0 flex-col",
        "border-r border-white/[0.05] bg-[#111113]",
        "transition-all duration-300 ease-in-out",
        sidebarW,
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
      ].join(" ")}
    >
      {/* ── Brand row ─────────────────────────────────────────────── */}
      <div
        className={[
          "flex shrink-0 items-center border-b border-white/[0.05]",
          collapsed ? "h-[60px] justify-center" : "h-[60px] justify-between px-4",
        ].join(" ")}
      >
        {collapsed ? (
          <span className="font-display text-[18px] font-bold text-gold">V</span>
        ) : (
          <div className="min-w-0 flex-1 px-1">
            <p className="font-display text-[15px] font-bold tracking-[0.12em] text-gold">
              VANTTAGE
            </p>
            <p className="mt-0.5 truncate text-[9.5px] uppercase tracking-[0.16em] text-zinc-600">
              {isSuperadmin ? "Super Admin" : (shop?.barbershopName ?? "Barbería")}
            </p>
          </div>
        )}

        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          className="hidden shrink-0 rounded-lg p-1.5 text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-300 lg:flex"
        >
          <ChevronLeft
            size={14}
            className={["transition-transform duration-300", collapsed ? "rotate-180" : ""].join(" ")}
          />
        </button>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar menú"
          className="shrink-0 rounded-lg p-1.5 text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-300 lg:hidden"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isExact = item.href === "/dashboard" || item.href === "/superadmin";
          const active  = isExact
            ? pathname === item.href
            : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              title={collapsed ? item.label : undefined}
              prefetch
              className={[
                "flex items-center rounded-xl border text-[13px] transition-all duration-150",
                collapsed
                  ? "h-10 w-10 justify-center p-0"
                  : "gap-3 px-3 py-2.5",
                active
                  ? "border-gold/25 bg-gold-subtle font-medium text-gold-light"
                  : "border-transparent text-zinc-500 hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-zinc-200",
              ].join(" ")}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

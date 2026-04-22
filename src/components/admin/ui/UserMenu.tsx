"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Avatar from "./Avatar";

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isSuperadmin = session?.user.role === "superadmin";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const ownerLinks = [
    { label: "Mi perfil", href: "/dashboard/perfil", icon: User },
    {
      label: "Configuración",
      href: "/dashboard/configuracion",
      icon: Settings,
    },
  ];

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menú de usuario"
        className={[
          "flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-all",
          open
            ? "border-emerald-400/40 bg-emerald-400/10"
            : "border-white/[0.08] hover:border-white/[0.14] hover:bg-white/[0.04]",
        ].join(" ")}
      >
        <Avatar src={null} alt={session?.user.name ?? "?"} size="sm" />

        <div className="hidden max-w-[120px] text-left sm:block">
          <p className="truncate text-[13.5px] font-medium text-zinc-200">
            {session?.user.name ?? "Usuario"}
          </p>
        </div>

        <ChevronDown
          size={14}
          className={[
            "hidden text-zinc-400 transition-transform sm:block",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[260px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E0E12] shadow-[0_28px_70px_rgba(0,0,0,0.6)]">
          {/* User info */}
          <div className="border-b border-white/[0.06] px-4 py-4">
            <p className="truncate text-[14px] font-semibold text-zinc-100">
              {session?.user.name}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-zinc-500">
              {session?.user.email}
            </p>

            <span className="mt-2 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-300">
              {isSuperadmin ? "Super Admin" : (session?.user.role ?? "Staff")}
            </span>
          </div>

          {/* Links */}
          {!isSuperadmin && (
            <div className="p-1.5">
              {ownerLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-zinc-300 transition hover:bg-white/[0.06] hover:text-zinc-100"
                >
                  <Icon size={16} className="text-zinc-400" />
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Sign out */}
          <div
            className={[
              "p-1.5",
              !isSuperadmin ? "border-t border-white/[0.06]" : "",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-zinc-400 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
``;

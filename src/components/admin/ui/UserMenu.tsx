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
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const ownerLinks = [
    { label: "Mi perfil", href: "/dashboard/perfil", icon: User },
    { label: "Configuración", href: "/dashboard/configuracion", icon: Settings },
  ];

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-all duration-150 ${
          open
            ? "border-gold/30 bg-gold-subtle"
            : "border-white/[0.07] hover:border-white/[0.13] hover:bg-white/[0.03]"
        }`}
        aria-label="Menú de usuario"
      >
        <Avatar
          src={null}
          alt={session?.user.name ?? "?"}
          size="sm"
        />
        <span className="hidden max-w-[110px] truncate text-[13px] font-medium text-zinc-300 sm:block">
          {session?.user.name ?? "Usuario"}
        </span>
        <ChevronDown
          size={12}
          className={`hidden flex-shrink-0 text-zinc-500 transition-transform duration-200 sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#18181b] shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
          {/* User info */}
          <div className="border-b border-white/[0.06] px-4 py-3.5">
            <p className="truncate text-[13px] font-semibold text-zinc-100">
              {session?.user.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-zinc-500">
              {session?.user.email}
            </p>
            <span className="mt-2 inline-flex rounded-full border border-gold-b bg-gold-subtle px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gold">
              {isSuperadmin ? "Super Admin" : (session?.user.role ?? "staff")}
            </span>
          </div>

          {/* Nav links — solo para owner */}
          {!isSuperadmin && (
            <div className="p-1.5">
              {ownerLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-zinc-400 transition hover:bg-white/[0.05] hover:text-zinc-100"
                >
                  <Icon size={14} className="flex-shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Sign out */}
          <div className={`p-1.5 ${!isSuperadmin ? "border-t border-white/[0.06]" : ""}`}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-zinc-500 transition hover:bg-red-500/5 hover:text-red-300"
            >
              <LogOut size={14} className="flex-shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

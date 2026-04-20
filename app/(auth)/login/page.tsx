"use client";

import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";

const ROLE_DESTINATIONS: Record<string, string> = {
  superadmin: "/superadmin",
  owner:      "/dashboard",
  client:     "/",
};

export default function LoginPage() {
  // useEffect evita hydration mismatch — los searchParams solo existen en cliente
  const [rawCallback, setRawCallback] = useState("");
  const [form, setForm]         = useState({ email: "", password: "" });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setRawCallback(p.get("callbackUrl") ?? "");
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email:    form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError("Credenciales inválidas o cuenta inactiva.");
      return;
    }

    const session     = await getSession();
    const role        = session?.user.role ?? "client";
    const defaultDest = ROLE_DESTINATIONS[role] ?? "/";

    const validCallback =
      rawCallback &&
      rawCallback.startsWith(defaultDest) &&
      !rawCallback.includes("//");

    window.location.href = validCallback ? rawCallback : defaultDest;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-6">

      {/* Glow dorado superior */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(182,134,44,0.18),transparent)]" />

      {/* Grid sutil — inline style evita problemas de hydration con clases arbitrarias */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right,#ffffff 1px,transparent 1px),linear-gradient(to bottom,#ffffff 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md">

        {/* ── LOGO ── */}
        <div className="mb-10 text-center">
          <p className="font-display text-[32px] font-semibold tracking-[0.18em] text-gold drop-shadow-[0_0_22px_rgba(182,134,44,0.5)]">
            VANTTAGE
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-zinc-600">
            Acceso a tu operación
          </p>
        </div>

        {/* ── CARD ── */}
        <div className="rounded-[2rem] border border-white/[0.06] bg-[#111113]/90 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-xl">

          <div className="mb-7">
            <h1 className="font-display text-[26px] font-semibold text-zinc-100">
              Inicia sesión
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
              Gestiona tu barbería sin fricción desde cualquier dispositivo.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>

            {/* EMAIL */}
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="admin@barberia.co"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 outline-none transition-all duration-200 placeholder:text-zinc-600 focus:border-gold/60 focus:bg-zinc-900 focus:ring-1 focus:ring-gold/20"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-zinc-500 transition hover:text-gold"
                >
                  Recuperar
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/60 px-4 py-3 pr-11 text-sm text-zinc-100 outline-none transition-all duration-200 placeholder:text-zinc-600 focus:border-gold/60 focus:bg-zinc-900 focus:ring-1 focus:ring-gold/20"
                />
                {/* Toggle mostrar/ocultar contraseña */}
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-600 transition hover:text-zinc-300"
                >
                  {showPass ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-sm text-red-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-gold py-3 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(182,134,44,0.3)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Ingresando...
                </span>
              ) : (
                "Entrar al panel"
              )}
            </button>

          </form>
        </div>

        {/* FOOTER */}
        <p className="mt-6 text-center text-sm text-zinc-600">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-gold/80 transition hover:text-gold">
            Registra tu barbería
          </Link>
        </p>

      </div>
    </div>
  );
}

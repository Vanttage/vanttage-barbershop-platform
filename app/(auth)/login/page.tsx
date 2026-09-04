"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

const ROLE_DESTINATIONS: Record<string, string> = {
  superadmin: "/superadmin",
  owner: "/dashboard",
  client: "/",
};

// ── Componente interno que usa useSearchParams (requiere Suspense padre) ──────
function LoginPageContent() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") ?? "";
  const oauthError = searchParams.get("error");

  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // mounted evita hydration mismatch causado por password managers
  // (1Password, Chrome, etc.) que inyectan elementos en el DOM antes de hidratar
  useEffect(() => {
    setMounted(true);
  }, []);

  // El callback signIn() de src/lib/auth.ts redirige aquí con ?error=...
  // cuando el correo de Google corresponde a una cuenta desactivada (no
  // cuando simplemente no existe — en ese caso el login con Google te lleva
  // directo a completar el registro, ver /register/completar).
  useEffect(() => {
    if (oauthError === "GoogleNoAccount") {
      setError(
        "Esa cuenta está inactiva. Contacta al soporte o inicia sesión con tu contraseña.",
      );
    } else if (oauthError) {
      setError("No pudimos iniciar sesión con Google. Intenta de nuevo.");
    }
  }, [oauthError]);

  if (!mounted) return null;

  function handleGoogleSignIn() {
    setGoogleLoading(true);
    signIn("google", { callbackUrl: "/dashboard" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError("Credenciales inválidas o cuenta inactiva.");
      return;
    }

    const session = await getSession();
    const role = session?.user.role ?? "client";
    const defaultDest = ROLE_DESTINATIONS[role] ?? "/";

    const validCallback =
      rawCallback &&
      rawCallback.startsWith(defaultDest) &&
      !rawCallback.includes("//");

    window.location.href = validCallback ? rawCallback : defaultDest;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-6">
      {/* Glow dorado */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(182,134,44,0.15),transparent)]" />

      {/* Grid sutil — inline style para evitar diferencias de parsing SSR/cliente */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* ── LOGO ── */}
        <div className="mb-12 text-center">
          <div className="font-display text-[38px] sm:text-[44px] font-semibold tracking-[0.12em]  bg-[#D4AF37] bg-clip-text text-transparent">
            NAVA
          </div>
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.24em] text-zinc-600">
            by VANTTAGE Tech
          </div>

          <div className="mt-3 text-[12px] uppercase tracking-[0.28em] text-zinc-500">
            Acceso a tu operación
          </div>
        </div>

        {/* ── CARD ── */}
        <div className="rounded-[2rem] border border-white/[0.06] bg-[#111113]/90 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl">
          <div className="mb-7">
            <h1 className="font-display text-[26px] font-semibold text-zinc-100">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Accede a tu panel de gestión.
            </p>
          </div>

          {/* GOOGLE */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.1] bg-white py-3 text-sm font-medium text-zinc-800 transition-all duration-200 hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-60"
          >
            {googleLoading ? (
              <svg
                className="animate-spin text-zinc-500"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.55-5.17 3.55-8.87Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11A12 12 0 0 0 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.28a12 12 0 0 0 0 10.8l3.99-3.11Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.6l3.99 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
                />
              </svg>
            )}
            Continuar con Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-600">
              o con tu correo
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="Email"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/60 py-3 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-all duration-200 placeholder:text-zinc-600 focus:border-gold/60 focus:ring-1 focus:ring-gold/20"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  Contraseña
                </span>
                <Link
                  href="/forgot-password"
                  className="text-xs text-zinc-500 transition hover:text-gold"
                >
                  Recuperar
                </Link>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/60 py-3 pl-10 pr-11 text-sm text-zinc-100 outline-none transition-all duration-200 placeholder:text-zinc-600 focus:border-gold/60 focus:ring-1 focus:ring-gold/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-600 transition hover:text-zinc-300"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(182,134,44,0.3)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Ingresando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── FOOTER ── */}
        <p className="mt-6 text-center text-sm text-zinc-600">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-gold/80 transition hover:text-gold"
          >
            Registra tu barbería
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Wrapper con Suspense — requerido por useSearchParams en Next.js 14 ────────
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]" />
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

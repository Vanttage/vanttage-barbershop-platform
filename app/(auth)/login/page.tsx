"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useState } from "react";

const ROLE_DESTINATIONS: Record<string, string> = {
  superadmin: "/superadmin",
  owner: "/dashboard",
  client: "/",
};

function LoginPageContent() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") ?? "";
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    // Resolve destination by role — never trust callbackUrl blindly across roles
    const session = await getSession();
    const role = session?.user.role ?? "client";
    const defaultDest = ROLE_DESTINATIONS[role] ?? "/";

    // Only honor callbackUrl if it belongs to the correct section for this role
    const validCallback =
      rawCallback &&
      rawCallback.startsWith(defaultDest) &&
      !rawCallback.includes("//");

    window.location.href = validCallback ? rawCallback : defaultDest;
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 text-center">
        <div className="font-display text-[28px] font-bold tracking-[0.12em] text-gold">
          VANTTAGE
        </div>
        <div className="mt-2 text-[12px] uppercase tracking-[0.18em] text-zinc-600">
          Acceso a tu operacion
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/[0.06] bg-[#111113] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-6">
          <h1 className="font-display text-[26px] font-bold text-zinc-100">
            Inicia sesion
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Entra al panel administrativo o al portal de cliente con una sola
            cuenta segura.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="admin@barberiarey.co"
              className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-gold-b"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                Contrasena
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-gold/80 transition hover:text-gold-light"
              >
                Recuperarla
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="Minimo 8 caracteres"
              className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-gold-b"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-gold-b bg-gold-subtle px-4 py-3 text-sm font-medium text-gold-light transition hover:bg-[rgba(182,134,44,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Entrar al panel"}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-zinc-600">
        ¿No tienes cuenta?{" "}
        <Link
          href="/register"
          className="font-medium text-gold/80 transition hover:text-gold-light"
        >
          Registra tu barberia
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md text-sm text-zinc-500">Cargando acceso...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

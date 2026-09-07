"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!done) return;
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          router.push("/login");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [done, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword }),
    });

    const json = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(json.error ?? "No fue posible actualizar la contraseña.");
      return;
    }

    setDone(true);
  }

  let content: React.ReactNode;

  if (!token) {
    content = (
      <div className="rounded-[2rem] border border-white/[0.06] bg-[#111113]/90 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 className="font-display text-[22px] font-bold text-zinc-100">Enlace inválido</h1>
        <p className="mt-2 text-sm text-zinc-500">Este enlace de restablecimiento no es válido o ya expiró. Solicita uno nuevo.</p>
        <Link href="/forgot-password" className="mt-6 block w-full rounded-xl bg-gold px-4 py-3 text-center text-sm font-semibold text-black transition-all duration-200 hover:brightness-110 active:scale-[0.98]">
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  } else if (done) {
    content = (
      <div className="rounded-[2rem] border border-white/[0.06] bg-[#111113]/90 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-display text-[24px] font-bold text-zinc-100">¡Contraseña actualizada!</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Tu contraseña se cambió correctamente. Redirigiendo al login en{" "}
          <span className="text-gold-light font-medium">{countdown}s</span>...
        </p>
        <Link href="/login" className="mt-6 block w-full rounded-xl border border-white/[0.06] bg-zinc-800/50 px-4 py-3 text-center text-sm font-medium text-zinc-300 transition hover:border-gold-border hover:text-gold-light">
          Ir al login ahora
        </Link>
      </div>
    );
  } else {
    content = (
      <div className="rounded-[2rem] border border-white/[0.06] bg-[#111113]/90 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <h1 className="font-display text-[26px] font-bold text-zinc-100">
          Nueva contraseña
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Define una contraseña segura para volver a entrar al sistema.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 outline-none transition-all duration-200 placeholder:text-zinc-600 focus:border-gold/60 focus:ring-1 focus:ring-gold/20"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 outline-none transition-all duration-200 placeholder:text-zinc-600 focus:border-gold/60 focus:ring-1 focus:ring-gold/20"
              placeholder="Repite la contraseña"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(182,134,44,0.3)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Guardar contraseña"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-600">
          <Link
            href="/login"
            className="font-medium text-gold/80 transition hover:text-gold-light"
          >
            Volver al login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-6">
      {/* Glow dorado */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(182,134,44,0.15),transparent)]" />

      {/* Grid sutil */}
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
          <div className="font-display text-[38px] sm:text-[44px] font-semibold tracking-[0.12em] bg-[#D4AF37] bg-clip-text text-transparent">
            NAVA
          </div>
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.24em] text-zinc-600">
            by VANTTAGE Tech
          </div>
        </div>

        {content}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]" />
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}

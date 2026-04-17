"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const json = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(json.error ?? "No fue posible procesar la solicitud.");
      return;
    }

    setSent(true);
    if (json._dev?.resetUrl) {
      setDevUrl(json._dev.resetUrl);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/[0.06] bg-[#111113] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-display text-[24px] font-bold text-zinc-100">Revisa tu correo</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Si el correo <span className="text-zinc-300">{email}</span> existe en el sistema, recibirás un enlace para restablecer tu contraseña.
        </p>

        {devUrl ? (
          <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-amber-400/70">
              Modo desarrollo — enlace directo
            </p>
            <Link
              href={devUrl}
              className="break-all text-[13px] text-amber-300 underline underline-offset-2 hover:text-amber-200"
            >
              {devUrl}
            </Link>
          </div>
        ) : null}

        <Link
          href="/login"
          className="mt-6 block w-full rounded-xl border border-white/[0.06] bg-zinc-800/50 px-4 py-3 text-center text-sm font-medium text-zinc-300 transition hover:border-gold-b hover:text-gold-light"
        >
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-[1.75rem] border border-white/[0.06] bg-[#111113] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <h1 className="font-display text-[26px] font-bold text-zinc-100">
        Recuperar contraseña
      </h1>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Ingresa tu correo y te enviaremos un enlace seguro para restablecer tu contraseña.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-gold-b"
            placeholder="superadmin@vanttage.app"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-xl border border-gold-b bg-gold-subtle px-4 py-3 text-sm font-medium text-gold-light transition hover:bg-[rgba(182,134,44,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Generando enlace..." : "Enviar instrucciones"}
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

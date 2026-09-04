"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, Phone, Scissors } from "lucide-react";

const INPUT_CLASS =
  "w-full rounded-xl border border-white/[0.08] bg-zinc-900/60 py-3 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-all duration-200 placeholder:text-zinc-600 focus:border-gold/60 focus:ring-1 focus:ring-gold/20";

const COMBINING_MARK_START = 0x0300;
const COMBINING_MARK_END = 0x036f;

function stripDiacritics(value: string) {
  return Array.from(value)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < COMBINING_MARK_START || code > COMBINING_MARK_END;
    })
    .join("");
}

function slugify(value: string) {
  return stripDiacritics(value.toLowerCase().normalize("NFD"))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(182,134,44,0.15),transparent)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}

export default function CompleteGoogleRegistrationPage() {
  const { data: session, status, update } = useSession();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState({ tenantName: "", slug: "", phone: "" });

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      tenantName: value,
      slug: slugTouched ? current.slug : slugify(value),
    }));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setForm((current) => ({ ...current, slug: slugify(value) }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/register/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await response.json();

    if (!response.ok) {
      setLoading(false);
      setError(json.error ?? "No fue posible crear la cuenta.");
      return;
    }

    // El token JWT seguía "pendiente" (sin tenantId) desde el signIn de
    // Google — hay que refrescarlo antes de navegar a /dashboard, si no el
    // middleware todavía lo ve como pendiente y lo devuelve aquí.
    await update();
    setSuccess(true);
    window.location.href = "/dashboard";
  }

  const canSubmit = form.tenantName.trim().length > 1 && form.slug.trim().length > 1;

  if (status === "loading") {
    return <PageShell><div /></PageShell>;
  }

  if (success) {
    return (
      <PageShell>
        <div className="text-center">
          <div className="rounded-[2rem] border border-white/[0.06] bg-[#111113]/90 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <h1 className="mt-5 font-display text-[24px] font-semibold text-zinc-100">
              ¡Cuenta creada!
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Tu barbería <span className="text-zinc-300">{form.tenantName}</span>{" "}
              ya está lista. Entrando a tu panel...
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* ── LOGO ── */}
      <div className="mb-10 text-center">
        <div className="font-display text-[38px] sm:text-[44px] font-semibold tracking-[0.12em] bg-[#D4AF37] bg-clip-text text-transparent">
          NAVA
        </div>
        <div className="mt-1.5 text-[10px] uppercase tracking-[0.24em] text-zinc-600">
          by VANTTAGE Tech
        </div>
        <div className="mt-3 text-[12px] uppercase tracking-[0.28em] text-zinc-500">
          Crea tu barbería
        </div>
      </div>

      {/* ── CARD ── */}
      <div className="rounded-[2rem] border border-white/[0.06] bg-[#111113]/90 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="mb-6">
          <h1 className="font-display text-[26px] font-semibold text-zinc-100">
            Solo un paso más
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Google ya nos dio tus datos. Solo necesitamos lo de tu barbería.
          </p>
        </div>

        {/* Identidad verificada por Google */}
        {session?.user ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-semibold text-gold">
              {(session.user.name ?? session.user.email ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-100">
                {session.user.name}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-zinc-500">
                {session.user.email}
                <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-emerald-400" />
              </p>
            </div>
          </div>
        ) : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* NOMBRE DE LA BARBERIA + SLUG */}
          <div>
            <div className="relative">
              <Scissors className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={form.tenantName}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="Nombre de tu barbería"
                autoComplete="organization"
                required
                className={INPUT_CLASS}
              />
            </div>
            {form.tenantName ? (
              <div className="mt-2 flex items-center gap-1 pl-1 text-xs text-zinc-600">
                <span className="shrink-0">tuenlace.vanttage.app/</span>
                <input
                  value={form.slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  className="w-full min-w-0 border-none bg-transparent p-0 text-gold-light/80 outline-none"
                />
              </div>
            ) : null}
          </div>

          {/* TELEFONO */}
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="Tu teléfono (opcional)"
              autoComplete="tel"
              className={INPUT_CLASS}
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(182,134,44,0.3)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creando barbería..." : "Crear mi barbería"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}

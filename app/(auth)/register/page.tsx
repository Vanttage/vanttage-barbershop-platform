"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { CheckCircle2, Eye, EyeOff, Lock, Mail, Scissors, User } from "lucide-react";

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

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState({
    tenantName: "",
    slug: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function handleGoogleSignUp() {
    setGoogleLoading(true);
    // El mismo botón sirve para crear cuenta o iniciar sesión: si el correo
    // de Google ya tiene barbería, entra directo; si no, el middleware lo
    // manda a /register/completar a terminar el registro sin contraseña.
    signIn("google", { callbackUrl: "/dashboard" });
  }

  function updateField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      tenantName: value,
      slug: slugTouched ? current.slug : slugify(value),
    }));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    updateField("slug", slugify(value));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(json.error ?? "No fue posible crear la cuenta.");
      return;
    }

    setSuccess(true);
  }

  const canSubmit =
    form.tenantName.trim().length > 1 &&
    form.slug.trim().length > 1 &&
    form.name.trim().length > 1 &&
    form.email.trim().length > 3 &&
    form.password.length >= 8 &&
    form.confirmPassword.length >= 8;

  if (success) {
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

        <div className="relative w-full max-w-md text-center">
          <div className="rounded-[2rem] border border-white/[0.06] bg-[#111113]/90 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <h1 className="mt-5 font-display text-[24px] font-semibold text-zinc-100">
              ¡Cuenta creada!
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Tu barbería <span className="text-zinc-300">{form.tenantName}</span>{" "}
              ya está lista. Inicia sesión con{" "}
              <span className="text-zinc-300">{form.email}</span> para continuar.
            </p>
            <Link
              href="/login"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(182,134,44,0.3)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 py-16">
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
          <div className="mb-7">
            <h1 className="font-display text-[26px] font-semibold text-zinc-100">
              Empieza gratis
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Solo lo esencial. Completa el resto cuando quieras desde
              Configuración.
            </p>
          </div>

          {/* GOOGLE */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
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
              o regístrate con tu correo
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

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

            {/* NOMBRE DEL DUEÑO */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Tu nombre completo"
                autoComplete="name"
                required
                className={INPUT_CLASS}
              />
            </div>

            {/* EMAIL */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="Email"
                autoComplete="email"
                required
                className={INPUT_CLASS}
              />
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                placeholder="Contraseña (mínimo 8 caracteres)"
                autoComplete="new-password"
                required
                className={`${INPUT_CLASS} pr-11`}
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

            {/* CONFIRM PASSWORD */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPass ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(event) =>
                  updateField("confirmPassword", event.target.value)
                }
                placeholder="Confirma tu contraseña"
                autoComplete="new-password"
                required
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
              {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
            </button>

            <p className="text-center text-xs text-zinc-600">
              Prueba gratis 30 días. Sin tarjeta de crédito.
            </p>
          </form>
        </div>

        {/* ── FOOTER ── */}
        <p className="mt-6 text-center text-sm text-zinc-600">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-gold/80 transition hover:text-gold"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

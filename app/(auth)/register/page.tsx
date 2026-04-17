"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

const plans = [
  {
    id: "basico",
    name: "Basico",
    price: "$80.000",
    description: "Agenda, clientes y automatizaciones esenciales.",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$120.000",
    description: "Operacion completa con seguimiento comercial.",
  },
  {
    id: "premium",
    name: "Premium",
    price: "$180.000",
    description: "Multi-sede, branding y escalamiento avanzado.",
  },
] as const;

type Step = "barberia" | "plan" | "cuenta";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("barberia");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tenantName: "",
    slug: "",
    city: "",
    country: "Colombia",
    phone: "",
    instagram: "",
    plan: "pro",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  function updateField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleNameChange(value: string) {
    const slug = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setForm((current) => ({ ...current, tenantName: value, slug }));
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
    if (!response.ok) {
      setLoading(false);
      setError(json.error ?? "No fue posible crear la cuenta.");
      return;
    }

    const loginResult = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (loginResult?.error) {
      setError(
        "La cuenta se creo, pero no pudimos iniciar sesion automaticamente.",
      );
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="w-full max-w-xl">
      <div className="mb-8 text-center">
        <div className="font-display text-[28px] font-bold tracking-[0.12em] text-gold">
          VANTTAGE
        </div>
        <div className="mt-2 text-[12px] uppercase tracking-[0.18em] text-zinc-600">
          Onboarding de barberia
        </div>
      </div>

      <div className="mb-8 flex items-center justify-center gap-2">
        {(["barberia", "plan", "cuenta"] as Step[]).map((currentStep, index) => {
          const currentIndex = ["barberia", "plan", "cuenta"].indexOf(step);
          const active = currentStep === step;
          const completed = index < currentIndex;

          return (
            <div key={currentStep} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                  completed
                    ? "border-gold bg-gold text-zinc-950"
                    : active
                      ? "border-gold text-gold"
                      : "border-white/[0.08] text-zinc-600"
                }`}
              >
                {completed ? "✓" : index + 1}
              </div>
              {index < 2 ? (
                <div className="h-px w-12 bg-white/[0.08]" />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-[1.75rem] border border-white/[0.06] bg-[#111113] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        {step === "barberia" ? (
          <div className="space-y-4">
            <div>
              <h1 className="font-display text-[26px] font-bold text-zinc-100">
                Datos de tu barberia
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Configuraremos tenant, sede principal y branding inicial.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                Nombre comercial
              </label>
              <input
                value={form.tenantName}
                onChange={(event) => handleNameChange(event.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-gold-b"
                placeholder="Barberia Rey"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Slug
                </label>
                <input
                  value={form.slug}
                  onChange={(event) => updateField("slug", event.target.value)}
                  className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-gold-b"
                  placeholder="barberia-rey"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Ciudad
                </label>
                <input
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-gold-b"
                  placeholder="Bogota"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  WhatsApp
                </label>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-gold-b"
                  placeholder="+57 300 000 0000"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Instagram
                </label>
                <input
                  value={form.instagram}
                  onChange={(event) =>
                    updateField("instagram", event.target.value)
                  }
                  className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-gold-b"
                  placeholder="@tu_barberia"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep("plan")}
              disabled={!form.tenantName || !form.slug}
              className="w-full rounded-xl border border-gold-b bg-gold-subtle px-4 py-3 text-sm font-medium text-gold-light transition hover:bg-[rgba(182,134,44,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continuar
            </button>
          </div>
        ) : null}

        {step === "plan" ? (
          <div>
            <div>
              <h1 className="font-display text-[26px] font-bold text-zinc-100">
                Elige tu plan
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Todos incluyen onboarding inicial y operacion lista para crecer.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {plans.map((plan) => {
                const active = form.plan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => updateField("plan", plan.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-gold-b bg-gold-subtle"
                        : "border-white/[0.06] bg-zinc-900/60 hover:border-white/[0.16]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-100">
                          {plan.name}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {plan.description}
                        </p>
                      </div>
                      <p className="font-display text-xl text-gold-light">
                        {plan.price}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep("barberia")}
                className="flex-1 rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/[0.16]"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => setStep("cuenta")}
                className="flex-1 rounded-xl border border-gold-b bg-gold-subtle px-4 py-3 text-sm font-medium text-gold-light transition hover:bg-[rgba(182,134,44,0.18)]"
              >
                Continuar
              </button>
            </div>
          </div>
        ) : null}

        {step === "cuenta" ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <h1 className="font-display text-[26px] font-bold text-zinc-100">
                Tu cuenta principal
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Esta cuenta quedara como dueño del tenant y administradora de la
                sede principal.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Nombre
                </label>
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-gold-b"
                  placeholder="Rey Barber"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-gold-b"
                  placeholder="admin@barberia.co"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Contrasena
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-gold-b"
                  placeholder="Minimo 8 caracteres"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Confirmar contrasena
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField("confirmPassword", event.target.value)
                  }
                  className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-gold-b"
                  placeholder="Repite tu contrasena"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-4 text-sm text-zinc-400">
              <p className="font-medium text-zinc-200">{form.tenantName}</p>
              <p className="mt-1">{form.slug}.vanttage.app</p>
              <p className="mt-2 text-gold-light">
                Plan {plans.find((plan) => plan.id === form.plan)?.name}
              </p>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("plan")}
                className="flex-1 rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/[0.16]"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl border border-gold-b bg-gold-subtle px-4 py-3 text-sm font-medium text-gold-light transition hover:bg-[rgba(182,134,44,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creando cuenta..." : "Crear barberia"}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <p className="mt-5 text-center text-sm text-zinc-600">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-gold/80 transition hover:text-gold-light"
        >
          Inicia sesion
        </Link>
      </p>
    </div>
  );
}

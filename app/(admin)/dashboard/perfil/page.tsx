"use client";

import { useEffect, useState } from "react";
import { Check, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { useApi, apiCall } from "@/src/hooks/useApi";
import Header from "@/src/components/admin/dashboard/Header";
import Avatar from "@/src/components/admin/ui/Avatar";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  tenant: { name: string; slug: string; plan: string } | null;
}

const PLAN_LABELS: Record<string, string> = {
  basico: "Básico",
  pro: "Pro",
  premium: "Premium",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  superadmin: "Super Admin",
  client: "Cliente",
};

export default function PerfilPage() {
  const { data: profile, loading } = useApi<ProfileData>("/api/profile");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    setError("");
    const { error: apiError } = await apiCall("/api/profile", "PATCH", {
      name,
      phone,
    });
    setSaving(false);
    if (apiError) {
      setError(apiError);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const dirty =
    profile && (name !== profile.name || phone !== (profile.phone ?? ""));

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="relative isolate min-h-screen bg-[#09090B] text-white">
      {/* Fondo SaaS — MISMO que Dashboard */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.055),transparent_34%)]" />
        <div className="absolute left-[-10%] top-[-8%] h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/[0.08] blur-3xl" />
        <div className="absolute bottom-[-12%] right-[-10%] h-[26rem] w-[26rem] rounded-full bg-cyan-500/[0.06] blur-3xl" />
      </div>

      <Header title="Mi perfil" />

      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6">
        {/* Profile hero */}
        <section className="mb-8 rounded-[28px] border border-white/[0.06] bg-white/[0.035] p-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {loading ? (
              <div className="h-24 w-24 rounded-full bg-white/[0.06] animate-pulse" />
            ) : (
              <Avatar
                src={profile?.avatarUrl}
                alt={profile?.name ?? "?"}
                size="xl"
              />
            )}

            <div className="min-w-0 flex-1">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-6 w-64 rounded bg-white/[0.06] animate-pulse" />
                  <div className="h-4 w-40 rounded bg-white/[0.04] animate-pulse" />
                </div>
              ) : (
                <>
                  <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-zinc-100">
                    {profile?.name}
                  </h2>
                  <p className="mt-1 text-[14px] text-zinc-400">
                    {profile?.email}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[12px] font-medium text-emerald-300">
                      <ShieldCheck size={14} />
                      {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role}
                    </span>

                    {profile?.tenant && (
                      <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[12px] text-zinc-400">
                        Plan{" "}
                        {PLAN_LABELS[profile.tenant.plan] ??
                          profile.tenant.plan}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Content grid */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Form */}
          <div className="rounded-[26px] border border-white/[0.06] bg-white/[0.035] p-6 sm:p-8">
            <h3 className="mb-6 text-[16px] font-semibold text-zinc-200">
              Información personal
            </h3>

            <div className="space-y-5">
              <div>
                <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  <User size={14} /> Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3.5 text-[15px] text-zinc-100 outline-none transition focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  <Mail size={14} /> Email
                </label>
                <input
                  readOnly
                  value={profile?.email ?? ""}
                  className="w-full cursor-not-allowed rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3.5 text-[15px] text-zinc-500"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  <Phone size={14} /> Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3.5 text-[15px] text-zinc-100 outline-none transition focus:border-emerald-400"
                />
              </div>
            </div>

            {error && (
              <p className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-[14px] text-red-300">
                {error}
              </p>
            )}

            <div className="mt-8 flex items-center justify-between">
              {joinedDate && (
                <span className="text-[13px] text-zinc-500">
                  Miembro desde {joinedDate}
                </span>
              )}

              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 text-[14px] font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-40"
              >
                {saved ? (
                  <>
                    <Check size={16} /> Guardado
                  </>
                ) : saving ? (
                  "Guardando…"
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>
          </div>

          {/* Tenant */}
          {profile?.tenant && (
            <div className="rounded-[26px] border border-white/[0.06] bg-white/[0.035] p-6 sm:p-8">
              <h3 className="mb-6 text-[16px] font-semibold text-zinc-200">
                Tu barbería
              </h3>

              <div className="space-y-4">
                {[
                  { label: "Nombre", value: profile.tenant.name },
                  { label: "Slug / URL", value: profile.tenant.slug },
                  {
                    label: "Plan activo",
                    value:
                      PLAN_LABELS[profile.tenant.plan] ?? profile.tenant.plan,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3"
                  >
                    <span className="text-[13px] text-zinc-400">{label}</span>
                    <span className="text-[14px] font-medium text-zinc-200">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

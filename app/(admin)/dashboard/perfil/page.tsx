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
    const { error: apiError } = await apiCall("/api/profile", "PATCH", { name, phone });
    setSaving(false);
    if (apiError) {
      setError(apiError);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const dirty = profile && (name !== profile.name || phone !== (profile.phone ?? ""));

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      <Header title="Mi perfil" />

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6">
        {/* Avatar + identity card */}
        <div className="flex items-center gap-5 rounded-2xl border border-white/[0.06] bg-[#111113] p-6">
          {loading ? (
            <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-full bg-zinc-800" />
          ) : (
            <Avatar src={profile?.avatarUrl} alt={profile?.name ?? "?"} size="xl" />
          )}
          <div className="min-w-0">
            {loading ? (
              <div className="space-y-2">
                <div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
                <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-800" />
              </div>
            ) : (
              <>
                <h2 className="font-display text-[20px] font-bold text-zinc-100">
                  {profile?.name}
                </h2>
                <p className="mt-0.5 text-[13px] text-zinc-500">{profile?.email}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-b bg-gold-subtle px-2.5 py-0.5 text-[11px] font-medium text-gold">
                    <ShieldCheck size={11} />
                    {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role}
                  </span>
                  {profile?.tenant && (
                    <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-zinc-500">
                      Plan {PLAN_LABELS[profile.tenant.plan] ?? profile.tenant.plan}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Edit form */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6">
          <h3 className="mb-5 font-display text-[14px] font-semibold text-zinc-200">
            Información personal
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
                <User size={11} />
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-[14px] text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-gold-b"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
                <Mail size={11} />
                Email
              </label>
              <input
                type="email"
                value={profile?.email ?? ""}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-white/[0.04] bg-zinc-900/40 px-4 py-3 text-[14px] text-zinc-600 outline-none"
              />
              <p className="mt-1 text-[11px] text-zinc-700">
                El email no puede modificarse desde aquí.
              </p>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
                <Phone size={11} />
                WhatsApp / Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-3 text-[14px] text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-gold-b"
                placeholder="+57 300 000 0000"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-[13px] text-red-300">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            {joinedDate && (
              <p className="text-[12px] text-zinc-600">Miembro desde {joinedDate}</p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="ml-auto flex items-center gap-2 rounded-xl border border-gold-b bg-gold-subtle px-5 py-2.5 text-[13px] font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.16)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saved ? (
                <>
                  <Check size={14} />
                  Guardado
                </>
              ) : saving ? (
                "Guardando..."
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </div>

        {/* Tenant info */}
        {profile?.tenant && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6">
            <h3 className="mb-4 font-display text-[14px] font-semibold text-zinc-200">Tu barbería</h3>
            <div className="space-y-3">
              {[
                { label: "Nombre", value: profile.tenant.name },
                { label: "Slug / URL", value: profile.tenant.slug },
                {
                  label: "Plan activo",
                  value: PLAN_LABELS[profile.tenant.plan] ?? profile.tenant.plan,
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[12.5px] text-zinc-500">{label}</span>
                  <span className="text-[13px] font-medium text-zinc-300">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

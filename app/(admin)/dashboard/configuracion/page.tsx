"use client";

import { useEffect, useState } from "react";
import Header from "@/src/components/admin/dashboard/Header";
import { apiCall, useApi } from "@/src/hooks/useApi";
import {
  Building2,
  Phone,
  MessageCircle,
  AtSign,
  MapPin,
  Clock,
  Image,
  Link2,
  Copy,
  Check,
  CheckCircle,
  Circle,
  ExternalLink,
  Save,
  AlertTriangle,
  Globe,
} from "lucide-react";

type SettingsData = {
  tenantName: string;
  tenantSlug: string;
  plan?: string;
  barbershopName: string;
  barbershopSlug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  openingTime: string | null;
  closingTime: string | null;
};

type FormData = {
  tenantName: string;
  barbershopName: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  openingTime: string;
  closingTime: string;
};

const FIELD_CLASS =
  "w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-gold-b placeholder:text-zinc-600";
const LABEL_CLASS =
  "mb-1.5 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] text-zinc-500";

function InputIcon({ children }: { children: React.ReactNode }) {
  return <span className="text-zinc-600">{children}</span>;
}

export default function ConfiguracionPage() {
  const { data, loading, refetch } = useApi<SettingsData>("/api/barbershop");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<FormData>({
    tenantName: "",
    barbershopName: "",
    description: "",
    logoUrl: "",
    bannerUrl: "",
    address: "",
    city: "",
    country: "Colombia",
    phone: "",
    whatsapp: "",
    instagram: "",
    openingTime: "09:00",
    closingTime: "19:00",
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      tenantName: data.tenantName ?? "",
      barbershopName: data.barbershopName ?? "",
      description: data.description ?? "",
      logoUrl: data.logoUrl ?? "",
      bannerUrl: data.bannerUrl ?? "",
      address: data.address ?? "",
      city: data.city ?? "",
      country: data.country ?? "Colombia",
      phone: data.phone ?? "",
      whatsapp: data.whatsapp ?? "",
      instagram: data.instagram ?? "",
      openingTime: data.openingTime ?? "09:00",
      closingTime: data.closingTime ?? "19:00",
    });
  }, [data]);

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "vanttage.app";
  const bookingUrl = data?.tenantSlug ? `https://${data.tenantSlug}.${baseDomain}` : "";

  const set = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    setSaving(true);
    setSaved(false);
    setError("");

    const { error: apiError } = await apiCall("/api/barbershop", "PATCH", form);

    setSaving(false);
    if (apiError) { setError(apiError); return; }
    setSaved(true);
    refetch();
    setTimeout(() => setSaved(false), 3000);
  };

  const copyUrl = () => {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checklist = [
    { label: "Nombre de barberia configurado", done: Boolean(form.barbershopName) },
    { label: "Numero de WhatsApp registrado", done: Boolean(form.whatsapp) },
    { label: "Horario de atencion definido", done: Boolean(form.openingTime && form.closingTime) },
    { label: "Direccion o ciudad visible", done: Boolean(form.address || form.city) },
    { label: "Instagram conectado", done: Boolean(form.instagram) },
    { label: "Logo de marca subido", done: Boolean(form.logoUrl) },
  ];

  const doneCount = checklist.filter((c) => c.done).length;
  const progress = Math.round((doneCount / checklist.length) * 100);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-950">
      <Header title="Configuracion" />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-7 py-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          {/* Form */}
          <div className="rounded-2xl border border-white/[0.05] bg-[#111113] p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Datos del negocio</h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Configura branding, contacto y horario de tu barberia.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || loading}
                className="flex items-center gap-2 rounded-xl border border-gold-b bg-gold-subtle px-4 py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  "Guardando..."
                ) : saved ? (
                  <><Check size={14} className="text-emerald-400" /> Guardado</>
                ) : (
                  <><Save size={14} /> Guardar cambios</>
                )}
              </button>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-800/40" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Negocio */}
                <div className="md:col-span-2">
                  <p className="mb-3 text-[10px] uppercase tracking-wider text-zinc-600">Identidad</p>
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    <InputIcon><Building2 size={11} /></InputIcon>
                    Nombre del tenant
                  </label>
                  <input value={form.tenantName} onChange={set("tenantName")} placeholder="Grupo Rey" className={FIELD_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    <InputIcon><Building2 size={11} /></InputIcon>
                    Nombre de la barberia
                  </label>
                  <input value={form.barbershopName} onChange={set("barbershopName")} placeholder="Barberia Rey" className={FIELD_CLASS} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_CLASS}>Descripcion</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={set("description")}
                    placeholder="Tu propuesta de valor para clientes: estilo, ambiente, equipo..."
                    className={FIELD_CLASS}
                  />
                </div>

                {/* Divider */}
                <div className="md:col-span-2 border-t border-white/[0.04] pt-4">
                  <p className="mb-3 text-[10px] uppercase tracking-wider text-zinc-600">Contacto</p>
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    <InputIcon><Phone size={11} /></InputIcon>
                    Telefono
                  </label>
                  <input value={form.phone} onChange={set("phone")} placeholder="+57 300 000 0000" className={FIELD_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    <InputIcon><MessageCircle size={11} /></InputIcon>
                    WhatsApp
                  </label>
                  <input value={form.whatsapp} onChange={set("whatsapp")} placeholder="+57 300 000 0000" className={FIELD_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    <InputIcon><AtSign size={11} /></InputIcon>
                    Instagram
                  </label>
                  <input value={form.instagram} onChange={set("instagram")} placeholder="@tubarberia" className={FIELD_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    <InputIcon><Globe size={11} /></InputIcon>
                    Ciudad
                  </label>
                  <input value={form.city} onChange={set("city")} placeholder="Bogota" className={FIELD_CLASS} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_CLASS}>
                    <InputIcon><MapPin size={11} /></InputIcon>
                    Direccion
                  </label>
                  <input value={form.address} onChange={set("address")} placeholder="Calle 72 #15-45, Bogota" className={FIELD_CLASS} />
                </div>

                {/* Divider */}
                <div className="md:col-span-2 border-t border-white/[0.04] pt-4">
                  <p className="mb-3 text-[10px] uppercase tracking-wider text-zinc-600">Horario de atencion</p>
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    <InputIcon><Clock size={11} /></InputIcon>
                    Apertura
                  </label>
                  <input type="time" value={form.openingTime} onChange={set("openingTime")} className={FIELD_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    <InputIcon><Clock size={11} /></InputIcon>
                    Cierre
                  </label>
                  <input type="time" value={form.closingTime} onChange={set("closingTime")} className={FIELD_CLASS} />
                </div>

                {/* Divider */}
                <div className="md:col-span-2 border-t border-white/[0.04] pt-4">
                  <p className="mb-3 text-[10px] uppercase tracking-wider text-zinc-600">Marca visual (URLs)</p>
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    <InputIcon><Image size={11} /></InputIcon>
                    Logo URL
                  </label>
                  <input value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://cdn.tuservicio.com/logo.png" className={FIELD_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    <InputIcon><Image size={11} /></InputIcon>
                    Banner URL
                  </label>
                  <input value={form.bannerUrl} onChange={set("bannerUrl")} placeholder="https://cdn.tuservicio.com/banner.jpg" className={FIELD_CLASS} />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {saved && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                <Check size={14} /> Configuracion guardada correctamente.
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Identity card */}
            <section className="rounded-2xl border border-white/[0.05] bg-[#111113] p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Link2 size={14} className="text-zinc-600" />
                Identidad del tenant
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Slug tenant", value: data?.tenantSlug ?? "—" },
                  { label: "Slug barberia", value: data?.barbershopSlug ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-600">{label}</span>
                    <span className="font-medium text-zinc-300">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-600">Plan</span>
                  <span className="rounded-full border border-gold-b bg-gold-subtle px-2.5 py-0.5 text-[10.5px] font-medium capitalize text-gold-light">
                    {data?.plan ?? "pro"}
                  </span>
                </div>
              </div>
            </section>

            {/* Booking URL */}
            <section className="rounded-2xl border border-white/[0.05] bg-[#111113] p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <ExternalLink size={14} className="text-zinc-600" />
                Booking publico
              </h3>
              <p className="mb-4 text-xs text-zinc-500">
                Comparte este link en tu bio, WhatsApp o anuncios para que los clientes reserven directamente.
              </p>
              <div className="flex items-center gap-2 overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/70">
                <span className="flex-1 truncate px-4 py-3 text-[12px] text-zinc-300">
                  {bookingUrl || "Cargando..."}
                </span>
                <div className="flex flex-shrink-0 items-center gap-1 pr-2">
                  <button
                    type="button"
                    onClick={copyUrl}
                    title="Copiar URL"
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                  {bookingUrl && (
                    <a
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                      title="Abrir en nueva pestana"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* Checklist */}
            <section className="rounded-2xl border border-white/[0.05] bg-[#111113] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <CheckCircle size={14} className="text-zinc-600" />
                  Checklist productivo
                </h3>
                <span className={`text-[11px] font-semibold ${doneCount === checklist.length ? "text-emerald-400" : "text-zinc-500"}`}>
                  {doneCount}/{checklist.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? "bg-emerald-400" : "bg-gold"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="space-y-2.5">
                {checklist.map(({ label, done }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    {done ? (
                      <CheckCircle size={14} className="mt-px flex-shrink-0 text-emerald-400" />
                    ) : (
                      <Circle size={14} className="mt-px flex-shrink-0 text-zinc-700" />
                    )}
                    <span className={`text-[12.5px] leading-5 ${done ? "text-zinc-400" : "text-zinc-600"}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {doneCount === checklist.length && (
                <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center text-[12px] text-emerald-400">
                  Tu perfil esta completo. Listo para recibir clientes.
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

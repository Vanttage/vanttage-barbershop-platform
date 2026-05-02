"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApi, useApiList, apiCall } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import type { Barber, PublicBarbershop, Service } from "@/src/types";
import { Star, MapPin, Clock, Loader2 } from "lucide-react";

type Step = "servicio" | "barbero" | "fecha" | "datos" | "confirmado";

interface BookingPageProps {
  tenantSlug?: string;
}

const NEXT_DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return d;
});

const STEPS: Step[] = ["servicio", "barbero", "fecha", "datos"];
const STEP_LABELS: Record<string, string> = {
  servicio: "Servicio",
  barbero:  "Barbero",
  fecha:    "Fecha",
  datos:    "Datos",
};

function getInitials(name: string) {
  return name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
}

/* ── Step indicator ─────────────────────────────────────────────────────── */

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="mb-10 flex items-center justify-center gap-0">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-all duration-300
              ${i < idx ? "border-gold bg-gold text-zinc-950" : i === idx ? "border-gold bg-transparent text-gold" : "border-white/[0.1] bg-transparent text-zinc-600"}`}
            >
              {i < idx ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-[10px] font-medium tracking-wide ${i === idx ? "text-gold" : i < idx ? "text-gold/60" : "text-zinc-700"}`}>
              {STEP_LABELS[s]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`mb-5 mx-1 h-px w-14 transition-all duration-500 ${i < idx ? "bg-gold/50" : "bg-white/[0.06]"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export default function BookingPage({ tenantSlug }: BookingPageProps) {
  const [step, setStep] = useState<Step>("servicio");
  const [selectedSvc, setSelectedSvc] = useState<string | null>(null);
  const [selectedBarb, setSelectedBarb] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsReason, setSlotsReason] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const qs = tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : "";

  const { data: services, loading: loadingSvcs } = useApiList<Service>(`/api/services${qs}`);
  const { data: barbers, loading: loadingBars } = useApiList<Barber>(`/api/barbers${qs}`);
  const { data: barbershop } = useApi<PublicBarbershop>(`/api/public/barbershop${qs}`);

  const svc    = services.find((s) => s.id === selectedSvc);
  const barber = barbers.find((b) => b.id === selectedBarb);

  const mapsUrl = (barbershop?.address || barbershop?.city)
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${barbershop.barbershopName} ${barbershop.address ?? ""} ${barbershop.city ?? ""}`.trim(),
      )}`
    : null;

  /* Cargar slots cuando cambia fecha o barbero */
  const loadSlots = useCallback(
    async (date: Date, barberId: string) => {
      if (!selectedSvc) return;
      setLoadingSlots(true);
      setSlots([]);
      setSelectedTime(null);
      const dateStr = date.toISOString().slice(0, 10);
      const effectiveBarberId = barberId === "any" ? barbers[0]?.id : barberId;
      if (!effectiveBarberId) { setLoadingSlots(false); return; }

      const res = await fetch(
        `/api/public/availability?barberId=${effectiveBarberId}&date=${dateStr}&serviceId=${selectedSvc}${tenantSlug ? `&tenantSlug=${tenantSlug}` : ""}`,
      );
      const json = await res.json();
      setSlots(json.data?.slots ?? []);
      setSlotsReason(json.data?.reason ?? null);
      setLoadingSlots(false);
    },
    [selectedSvc, barbers, tenantSlug],
  );

  useEffect(() => {
    if (selectedDate && selectedBarb) {
      loadSlots(selectedDate, selectedBarb);
    }
  }, [selectedDate, selectedBarb, loadSlots]);

  const reset = () => {
    setStep("servicio"); setSelectedSvc(null); setSelectedBarb(null);
    setSelectedDate(null); setSelectedTime(null); setSlots([]); setSlotsReason(null);
    setError(""); setForm({ name: "", phone: "", email: "" }); setConfirmedId(null);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    if (!selectedSvc || !selectedBarb || !selectedDate || !selectedTime) {
      setError("Completa todos los pasos");
      setLoading(false);
      return;
    }

    const [h, m] = selectedTime.split(":").map(Number);
    const startsAt = new Date(selectedDate);
    startsAt.setHours(h, m, 0, 0);

    const barberId = selectedBarb === "any" ? barbers[0]?.id : selectedBarb;
    if (!barberId) {
      setError("No hay barberos disponibles.");
      setLoading(false);
      return;
    }

    const { data, error: apiError } = await apiCall<{ id: string }>(
      `/api/appointments${qs}`,
      "POST",
      { barberId, serviceId: selectedSvc, clientName: form.name, clientPhone: form.phone, clientEmail: form.email || undefined, startsAt: startsAt.toISOString() },
    );

    setLoading(false);
    if (apiError) { setError(apiError); return; }
    setConfirmedId((data as { id?: string })?.id ?? null);
    setStep("confirmado");
  };

  /* ── CONFIRMED ─────────────────────────────────────────────────────────── */
  if (step === "confirmado") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="relative mx-auto mb-8 h-20 w-20">
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/10" style={{ animationDuration: "2s" }} />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <h2 className="mb-2 text-[28px] font-semibold text-zinc-100">¡Cita confirmada!</h2>
          <p className="mb-8 text-[14px] leading-relaxed text-zinc-500">
            Hola <span className="font-medium text-zinc-300">{form.name}</span>, tu cita está lista.
            <br />
            Recibirás confirmación por WhatsApp.
          </p>

          <div className="mb-4 space-y-3 rounded-2xl border border-white/[0.06] bg-[#111113] p-5 text-left">
            {[
              { label: "Servicio", value: svc?.name },
              { label: "Barbero", value: selectedBarb === "any" ? "Sin preferencia" : barber?.name },
              { label: "Fecha", value: selectedDate?.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }) },
              { label: "Hora",  value: selectedTime },
              { label: "Precio", value: svc ? formatCOP(svc.price) : "" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-[12.5px] text-zinc-500">{label}</span>
                <span className="text-[13px] font-medium text-zinc-200">{value}</span>
              </div>
            ))}
          </div>

          {confirmedId && (
            <a
              href={`/mi-cita/${confirmedId}`}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-[13px] text-zinc-400 transition hover:border-white/[0.14] hover:text-zinc-200"
            >
              Ver y gestionar mi cita →
            </a>
          )}
          <button
            onClick={reset}
            className="w-full rounded-xl border border-gold-b bg-gold-subtle py-3.5 text-[14px] font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)]"
          >
            Reservar otra cita
          </button>
        </div>
      </div>
    );
  }

  /* ── WIZARD ────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-zinc-950" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(201,168,76,0.03) 0%, transparent 60%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          <div>
            <div className="text-[18px] font-semibold tracking-wider text-gold">
              {barbershop?.barbershopName ?? "VANTTAGE"}
            </div>
            <div className="mt-0.5 text-[10.5px] text-zinc-600">
              {[barbershop?.address, barbershop?.city].filter(Boolean).join(", ")}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mr-1 rounded-lg p-1.5 text-zinc-600 hover:text-zinc-400" title="Ver en Google Maps">
                <MapPin size={14} />
              </a>
            )}
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[11px] text-zinc-500">
              {barbershop?.openingTime && barbershop?.closingTime
                ? `${barbershop.openingTime} – ${barbershop.closingTime}`
                : "Abierto"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 py-10">
        <StepBar current={step} />

        {/* STEP 1 — Servicio */}
        {step === "servicio" && (
          <div className="space-y-3">
            <h2 className="mb-6 text-[22px] font-medium text-zinc-100">¿Qué servicio quieres?</h2>
            {loadingSvcs
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-800/40" />)
              : services.filter((s) => s.active).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSvc(s.id); setStep("barbero"); }}
                    className="group flex w-full items-center justify-between rounded-xl border border-white/[0.05] bg-[#111113] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-gold-b hover:bg-[rgba(201,168,76,0.04)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-zinc-800/80 transition-colors group-hover:border-gold-b">
                        <span className="text-[14px] font-semibold leading-none text-zinc-200">{s.durationMin}</span>
                        <span className="mt-0.5 text-[9px] text-zinc-600">min</span>
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-zinc-100">{s.name}</p>
                        <p className="mt-0.5 text-[12px] text-zinc-500">{s.durationMin} minutos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[17px] font-semibold text-gold-light">{formatCOP(s.price)}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-600">COP</p>
                    </div>
                  </button>
                ))}
          </div>
        )}

        {/* STEP 2 — Barbero */}
        {step === "barbero" && (
          <div className="space-y-3">
            <h2 className="mb-6 text-[22px] font-medium text-zinc-100">¿Con quién?</h2>
            {!loadingBars && barbers.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-5 text-center">
                <p className="text-[13px] text-zinc-400">Sin barberos disponibles. Contacta al negocio.</p>
              </div>
            ) : (
              <button
                onClick={() => { setSelectedBarb("any"); setStep("fecha"); }}
                className="flex w-full items-center gap-4 rounded-xl border border-white/[0.05] bg-[#111113] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-gold-b hover:bg-[rgba(201,168,76,0.04)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-zinc-800 text-[18px] text-zinc-400">✦</div>
                <div>
                  <p className="text-[14px] font-medium text-zinc-100">Sin preferencia</p>
                  <p className="mt-0.5 text-[12px] text-zinc-500">Primer barbero disponible</p>
                </div>
              </button>
            )}
            {loadingBars
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-800/40" />)
              : barbers.filter((b) => b.active !== false).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setSelectedBarb(b.id); setStep("fecha"); }}
                    className="flex w-full items-center gap-4 rounded-xl border border-white/[0.05] bg-[#111113] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-gold-b hover:bg-[rgba(201,168,76,0.04)]"
                  >
                    {b.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.photoUrl} alt={b.name} className="h-12 w-12 rounded-full object-cover border-2 border-gold-b" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold-b bg-[#8B6B2E] text-[14px] font-bold text-gold-light">
                        {getInitials(b.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-medium text-zinc-100">{b.name}</p>
                        {b.rating && b.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-[11px] text-amber-300">
                            <Star size={10} fill="#FCD34D" stroke="#FCD34D" />
                            {b.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {b.specialty && <p className="mt-0.5 text-[12px] text-zinc-500">{b.specialty}</p>}
                    </div>
                  </button>
                ))}
            <button onClick={() => setStep("servicio")} className="w-full pt-2 text-center text-[12.5px] text-zinc-600 transition-colors hover:text-zinc-400">
              ← Volver
            </button>
          </div>
        )}

        {/* STEP 3 — Fecha y hora */}
        {step === "fecha" && (
          <div>
            <h2 className="mb-6 text-[22px] font-medium text-zinc-100">¿Cuándo?</h2>

            {/* Date scroll */}
            <p className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.08em] text-zinc-600">Fecha</p>
            <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-3">
              {NEXT_DAYS.slice(0, 12).map((d) => {
                const isSun = d.getDay() === 0;
                const isSel = selectedDate?.toDateString() === d.toDateString();
                return (
                  <button
                    key={d.toISOString()}
                    disabled={isSun}
                    onClick={() => setSelectedDate(d)}
                    className={`w-14 shrink-0 rounded-xl border py-3 text-center transition-all ${
                      isSel ? "border-gold bg-gold-subtle text-gold-light"
                      : !isSun ? "border-white/[0.05] bg-[#111113] hover:border-gold-b"
                      : "cursor-not-allowed border-white/[0.03] bg-zinc-900 opacity-25"
                    }`}
                  >
                    <div className={`text-[10px] font-medium ${isSel ? "text-gold" : "text-zinc-600"}`}>
                      {d.toLocaleDateString("es-CO", { weekday: "short" }).slice(0, 3).toUpperCase()}
                    </div>
                    <div className={`mt-0.5 text-[18px] font-semibold ${isSel ? "text-gold-light" : "text-zinc-300"}`}>{d.getDate()}</div>
                    <div className={`text-[9px] ${isSel ? "text-gold/70" : "text-zinc-700"}`}>
                      {d.toLocaleDateString("es-CO", { month: "short" })}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Slots */}
            {selectedDate && (
              <>
                <p className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.08em] text-zinc-600">
                  Hora disponible
                </p>
                {loadingSlots ? (
                  <div className="mb-6 flex justify-center py-6">
                    <Loader2 size={22} className="animate-spin text-zinc-600" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="mb-6 rounded-xl border border-white/[0.05] bg-zinc-900/40 py-5 text-center">
                    <Clock size={18} className="mx-auto mb-2 text-zinc-600" />
                    <p className="text-[13px] text-zinc-500">
                      {slotsReason ?? "Sin horarios disponibles este día"}
                    </p>
                  </div>
                ) : (
                  <div className="mb-6 grid grid-cols-4 gap-2">
                    {slots.map((h) => (
                      <button
                        key={h}
                        onClick={() => setSelectedTime(h)}
                        className={`rounded-lg border py-2.5 text-[13px] font-medium transition-all ${
                          selectedTime === h
                            ? "border-gold bg-gold-subtle text-gold-light"
                            : "border-white/[0.05] bg-[#111113] text-zinc-500 hover:border-gold-b hover:text-zinc-200"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => setStep("datos")}
              disabled={!selectedDate || !selectedTime}
              className="mb-3 w-full rounded-xl border border-gold-b bg-gold-subtle py-4 text-[14px] font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Continuar →
            </button>
            <button onClick={() => setStep("barbero")} className="w-full pt-1 text-center text-[12.5px] text-zinc-600 transition-colors hover:text-zinc-400">
              ← Volver
            </button>
          </div>
        )}

        {/* STEP 4 — Datos del cliente */}
        {step === "datos" && (
          <div>
            <h2 className="mb-6 text-[22px] font-medium text-zinc-100">Tus datos</h2>

            {/* Summary */}
            <div className="mb-6 space-y-2 rounded-xl border border-white/[0.05] bg-[#111113] p-4">
              {[
                { label: "Servicio", value: svc?.name },
                { label: "Barbero", value: selectedBarb === "any" ? "Sin preferencia" : barber?.name },
                { label: "Fecha", value: selectedDate?.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }) },
                { label: "Hora",  value: selectedTime },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-[12px] text-zinc-600">{label}</span>
                  <span className="text-[12.5px] font-medium text-zinc-300">{value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/[0.04] pt-2">
                <span className="text-[12px] font-medium text-zinc-500">Total</span>
                <span className="text-[16px] font-semibold text-gold-light">{svc ? formatCOP(svc.price) : ""}</span>
              </div>
            </div>

            {/* Form */}
            <div className="mb-6 space-y-4">
              {[
                { key: "name",  label: "Nombre completo", placeholder: "Tu nombre",       type: "text" },
                { key: "phone", label: "WhatsApp",         placeholder: "+57 300 000 0000", type: "tel" },
                { key: "email", label: "Email (opcional)", placeholder: "tu@email.com",    type: "email" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.07em] text-zinc-500">
                    {label}
                  </label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/50 px-4 py-3 text-[14px] text-zinc-100 outline-none transition-colors focus:border-gold-b placeholder:text-zinc-700"
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-[12.5px] text-red-400">{error}</span>
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={!form.name || !form.phone || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-b bg-gold-subtle py-4 text-[15px] font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Confirmando..." : "Confirmar cita →"}
            </button>
            <p className="mt-3 text-center text-[11px] text-zinc-700">
              Al confirmar aceptas recibir recordatorios por WhatsApp
            </p>
            <button onClick={() => setStep("fecha")} className="w-full pt-3 text-center text-[12.5px] text-zinc-600 transition-colors hover:text-zinc-400">
              ← Volver
            </button>
          </div>
        )}
      </main>

      <footer className="mx-auto mt-10 max-w-lg border-t border-white/[0.03] px-5 py-8 text-center">
        <div className="text-[11px] text-zinc-700">
          Powered by <span className="font-medium tracking-wider text-gold/60">VANTTAGE</span>
        </div>
      </footer>
    </div>
  );
}

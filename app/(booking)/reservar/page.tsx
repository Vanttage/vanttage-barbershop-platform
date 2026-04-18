"use client";

import React, { useState } from "react";
import { useApi, useApiList, apiCall } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import type {
  AppointmentWithRelations,
  Barber,
  PublicBarbershop,
  Service,
} from "@/src/types";

type Step = "servicio" | "barbero" | "fecha" | "datos" | "confirmado";

const HOURS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];
const NEXT_DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return d;
});
const STEPS: Step[] = ["servicio", "barbero", "fecha", "datos"];
const STEP_LABELS: Record<string, string> = {
  servicio: "Servicio",
  barbero: "Barbero",
  fecha: "Fecha",
  datos: "Datos",
};

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold border-2 transition-all duration-300
              ${i < idx ? "bg-gold border-gold text-zinc-950" : i === idx ? "bg-transparent border-gold text-gold" : "bg-transparent border-white/[0.1] text-zinc-600"}`}
            >
              {i < idx ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[10px] font-medium tracking-wide ${i === idx ? "text-gold" : i < idx ? "text-gold/60" : "text-zinc-700"}`}
            >
              {STEP_LABELS[s]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-14 h-px mb-5 mx-1 transition-all duration-500 ${i < idx ? "bg-gold/50" : "bg-white/[0.06]"}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function BookingPage() {
  const [step, setStep] = useState<Step>("servicio");
  const [selectedSvc, setSelectedSvc] = useState<string | null>(null);
  const [selectedBarb, setSelectedBarb] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  // Datos reales de la API
  const { data: services, loading: loadingSvcs } =
    useApiList<Service>("/api/services");
  const { data: barbers, loading: loadingBars } =
    useApiList<Barber>("/api/barbers");
  const { data: barbershop } = useApi<PublicBarbershop>(
    "/api/public/barbershop",
  );

  const svc = services.find((s) => s.id === selectedSvc);
  const barber = barbers.find((b) => b.id === selectedBarb);

  const reset = () => {
    setStep("servicio");
    setSelectedSvc(null);
    setSelectedBarb(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setError("");
    setForm({ name: "", phone: "", email: "" });
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
      setError("No hay barberos disponibles. Contacta la barbería directamente.");
      setLoading(false);
      return;
    }

    const { error: apiError } = await apiCall<AppointmentWithRelations>(
      "/api/appointments",
      "POST",
      {
        barberId,
        serviceId: selectedSvc,
        clientName: form.name,
        clientPhone: form.phone,
        clientEmail: form.email || undefined,
        startsAt: startsAt.toISOString(),
      },
    );

    setLoading(false);
    if (apiError) {
      setError(apiError);
      return;
    }
    setStep("confirmado");
  };

  if (step === "confirmado") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="relative mx-auto w-20 h-20 mb-8">
            <div
              className="absolute inset-0 rounded-full bg-emerald-400/10 animate-ping"
              style={{ animationDuration: "2s" }}
            />
            <div className="relative w-20 h-20 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <h2 className="font-display text-[28px] font-semibold text-zinc-100 mb-2">
            ¡Cita confirmada!
          </h2>
          <p className="text-[14px] text-zinc-500 mb-8 leading-relaxed">
            Hola <span className="text-zinc-300 font-medium">{form.name}</span>,
            tu cita está lista.
            <br />
            Recibirás confirmación por WhatsApp.
          </p>
          <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 text-left mb-6 space-y-3">
            {[
              { label: "Servicio", value: svc?.name },
              {
                label: "Barbero",
                value:
                  selectedBarb === "any" ? "Sin preferencia" : barber?.name,
              },
              {
                label: "Fecha",
                value: selectedDate?.toLocaleDateString("es-CO", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }),
              },
              { label: "Hora", value: selectedTime },
              { label: "Precio", value: svc ? formatCOP(svc.price) : "" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-[12.5px] text-zinc-500">{label}</span>
                <span className="text-[13px] font-medium text-zinc-200">
                  {value}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={reset}
            className="w-full py-3.5 rounded-xl bg-gold-subtle border border-gold-b text-[14px] font-medium text-gold-light hover:bg-[rgba(201,168,76,0.18)] transition-all"
          >
            Reservar otra cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-zinc-950"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 50%, rgba(201,168,76,0.03) 0%, transparent 60%)",
      }}
    >
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-white/[0.04]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <div className="font-display text-[18px] font-semibold text-gold tracking-wider">
              {barbershop?.barbershopName ?? "VANTTAGE"}
            </div>
            <div className="mt-0.5 text-[10.5px] text-zinc-600">
              {[barbershop?.address, barbershop?.city]
                .filter(Boolean)
                .join(", ")}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-zinc-500">Abierto ahora</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-10">
        <StepBar current={step} />

        {/* STEP 1 */}
        {step === "servicio" && (
          <div className="space-y-3">
            <div className="mb-6">
              <h2 className="font-display text-[22px] font-medium text-zinc-100 mb-1">
                ¿Qué servicio quieres?
              </h2>
            </div>
            {loadingSvcs
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-zinc-800/40 rounded-xl animate-pulse"
                  />
                ))
              : services
                  .filter((s) => s.active)
                  .map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSvc(s.id);
                        setStep("barbero");
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-[#111113] border border-white/[0.05] hover:border-gold-b hover:bg-[rgba(201,168,76,0.04)] transition-all hover:-translate-y-0.5 text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-white/[0.06] flex flex-col items-center justify-center group-hover:border-gold-b transition-colors">
                          <span className="text-[14px] font-semibold text-zinc-200 leading-none">
                            {s.durationMin}
                          </span>
                          <span className="text-[9px] text-zinc-600 mt-0.5">
                            min
                          </span>
                        </div>
                        <div>
                          <div className="text-[14px] font-medium text-zinc-100">
                            {s.name}
                          </div>
                          <div className="text-[12px] text-zinc-500 mt-0.5">
                            {s.durationMin} minutos
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-[17px] font-semibold text-gold-light">
                          {formatCOP(s.price)}
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-0.5">
                          COP
                        </div>
                      </div>
                    </button>
                  ))}
          </div>
        )}

        {/* STEP 2 */}
        {step === "barbero" && (
          <div className="space-y-3">
            <div className="mb-6">
              <h2 className="font-display text-[22px] font-medium text-zinc-100 mb-1">
                ¿Con quién?
              </h2>
            </div>
            {!loadingBars && barbers.length === 0 ? (
              <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-center">
                <p className="text-[13px] text-zinc-400">
                  Esta barbería aún no tiene barberos registrados.
                </p>
                <p className="text-[12px] text-zinc-600 mt-1">
                  Contacta directamente al negocio para agendar.
                </p>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSelectedBarb("any");
                  setStep("fecha");
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#111113] border border-white/[0.05] hover:border-gold-b hover:bg-[rgba(201,168,76,0.04)] transition-all hover:-translate-y-0.5 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-zinc-400 text-[18px]">
                  ✦
                </div>
                <div>
                  <div className="text-[14px] font-medium text-zinc-100">
                    Sin preferencia
                  </div>
                  <div className="text-[12px] text-zinc-500 mt-0.5">
                    Primer barbero disponible
                  </div>
                </div>
              </button>
            )}
            {loadingBars
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-zinc-800/40 rounded-xl animate-pulse"
                  />
                ))
              : barbers.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBarb(b.id);
                      setStep("fecha");
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#111113] border border-white/[0.05] hover:border-gold-b hover:bg-[rgba(201,168,76,0.04)] transition-all hover:-translate-y-0.5 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#8B6B2E] border-2 border-gold-b flex items-center justify-center text-[14px] font-bold text-gold-light">
                      {b.name
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-medium text-zinc-100">
                        {b.name}
                      </div>
                      <div className="text-[12px] text-zinc-500 mt-0.5">
                        {b.specialty}
                      </div>
                    </div>
                  </button>
                ))}
            <button
              onClick={() => setStep("servicio")}
              className="w-full text-center text-[12.5px] text-zinc-600 hover:text-zinc-400 transition-colors pt-2"
            >
              ← Volver
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === "fecha" && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-[22px] font-medium text-zinc-100 mb-1">
                ¿Cuándo?
              </h2>
            </div>
            <p className="text-[10.5px] text-zinc-600 uppercase tracking-[0.08em] font-medium mb-3">
              Fecha
            </p>
            <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
              {NEXT_DAYS.slice(0, 12).map((d) => {
                const isSun = d.getDay() === 0;
                const isSel = selectedDate?.toDateString() === d.toDateString();
                return (
                  <button
                    key={d.toISOString()}
                    disabled={isSun}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedTime(null);
                    }}
                    className={`flex-shrink-0 w-14 py-3 rounded-xl border text-center transition-all ${isSel ? "bg-gold-subtle border-gold text-gold-light" : !isSun ? "bg-[#111113] border-white/[0.05] hover:border-gold-b" : "opacity-25 bg-zinc-900 border-white/[0.03] cursor-not-allowed"}`}
                  >
                    <div
                      className={`text-[10px] font-medium ${isSel ? "text-gold" : "text-zinc-600"}`}
                    >
                      {d
                        .toLocaleDateString("es-CO", { weekday: "short" })
                        .slice(0, 3)
                        .toUpperCase()}
                    </div>
                    <div
                      className={`text-[18px] font-semibold mt-0.5 ${isSel ? "text-gold-light" : "text-zinc-300"}`}
                    >
                      {d.getDate()}
                    </div>
                    <div
                      className={`text-[9px] ${isSel ? "text-gold/70" : "text-zinc-700"}`}
                    >
                      {d.toLocaleDateString("es-CO", { month: "short" })}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedDate && (
              <>
                <p className="text-[10.5px] text-zinc-600 uppercase tracking-[0.08em] font-medium mb-3">
                  Hora disponible
                </p>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      onClick={() => setSelectedTime(h)}
                      className={`py-2.5 rounded-lg border text-[13px] font-medium transition-all ${selectedTime === h ? "bg-gold-subtle border-gold text-gold-light" : "bg-[#111113] border-white/[0.05] text-zinc-500 hover:border-gold-b hover:text-zinc-200"}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button
              onClick={() => setStep("datos")}
              disabled={!selectedDate || !selectedTime}
              className="w-full py-4 rounded-xl font-medium text-[14px] bg-gold-subtle border border-gold-b text-gold-light hover:bg-[rgba(201,168,76,0.18)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Continuar →
            </button>
            <button
              onClick={() => setStep("barbero")}
              className="w-full text-center text-[12.5px] text-zinc-600 hover:text-zinc-400 transition-colors pt-3"
            >
              ← Volver
            </button>
          </div>
        )}

        {/* STEP 4 */}
        {step === "datos" && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-[22px] font-medium text-zinc-100 mb-1">
                Tus datos
              </h2>
            </div>
            <div className="bg-[#111113] border border-white/[0.05] rounded-xl p-4 mb-6 space-y-2">
              {[
                { label: "Servicio", value: svc?.name },
                {
                  label: "Barbero",
                  value:
                    selectedBarb === "any" ? "Sin preferencia" : barber?.name,
                },
                {
                  label: "Fecha",
                  value: selectedDate?.toLocaleDateString("es-CO", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }),
                },
                { label: "Hora", value: selectedTime },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-[12px] text-zinc-600">{label}</span>
                  <span className="text-[12.5px] font-medium text-zinc-300">
                    {value}
                  </span>
                </div>
              ))}
              <div className="border-t border-white/[0.04] pt-2 flex justify-between">
                <span className="text-[12px] text-zinc-500 font-medium">
                  Total
                </span>
                <span className="font-display text-[16px] font-semibold text-gold-light">
                  {svc ? formatCOP(svc.price) : ""}
                </span>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              {[
                {
                  key: "name",
                  label: "Nombre completo",
                  placeholder: "Tu nombre",
                  type: "text",
                },
                {
                  key: "phone",
                  label: "WhatsApp",
                  placeholder: "+57 300 000 0000",
                  type: "tel",
                },
                {
                  key: "email",
                  label: "Email (opcional)",
                  placeholder: "tu@email.com",
                  type: "email",
                },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-[11px] text-zinc-500 uppercase tracking-[0.07em] font-medium mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                    className="w-full bg-zinc-800/50 border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-gold-b transition-colors"
                  />
                </div>
              ))}
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5 mb-4">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-[12.5px] text-red-400">{error}</span>
              </div>
            )}
            <button
              onClick={handleConfirm}
              disabled={!form.name || !form.phone || loading}
              className="w-full py-4 rounded-xl font-medium text-[15px] bg-gold-subtle border border-gold-b text-gold-light hover:bg-[rgba(201,168,76,0.18)] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  Confirmando...
                </>
              ) : (
                "Confirmar cita →"
              )}
            </button>
            <p className="text-[11px] text-zinc-700 text-center mt-3">
              Al confirmar aceptas recibir recordatorios por WhatsApp
            </p>
            <button
              onClick={() => setStep("fecha")}
              className="w-full text-center text-[12.5px] text-zinc-600 hover:text-zinc-400 transition-colors pt-3"
            >
              ← Volver
            </button>
          </div>
        )}
      </main>
      <footer className="max-w-lg mx-auto px-5 py-8 text-center border-t border-white/[0.03] mt-10">
        <div className="text-[11px] text-zinc-700">
          Powered by{" "}
          <span className="text-gold/60 font-medium tracking-wider">
            VANTTAGE
          </span>
        </div>
      </footer>
    </div>
  );
}

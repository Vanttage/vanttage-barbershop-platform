"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Clock,
  Scissors,
  User,
  MapPin,
  Star,
  CalendarDays,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  RefreshCw,
} from "lucide-react";
import { formatCOP } from "@/src/types";

/* ── types ──────────────────────────────────────────────────────────────── */

type ApptData = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  price: number;
  total: number;
  notes: string | null;
  cancelReason: string | null;
  barber: { id: string; name: string; specialty: string | null; photoUrl: string | null; rating: number };
  service: { id: string; name: string; durationMin: number; price: number };
  client: { id: string; name: string; phone: string };
  barbershop: { id: string; name: string; address: string | null; city: string | null; whatsapp: string | null };
  tenantSlug: string;
  tenantName: string;
  canCancel: boolean;
  canReschedule: boolean;
};

const STATUS_LABEL: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:     { label: "Pendiente de confirmar", color: "text-amber-300",  icon: <Clock size={16} className="text-amber-300" /> },
  confirmed:   { label: "Confirmada",              color: "text-emerald-300", icon: <CheckCircle size={16} className="text-emerald-300" /> },
  in_progress: { label: "En atención",             color: "text-blue-300",   icon: <Scissors size={16} className="text-blue-300" /> },
  completed:   { label: "Completada",              color: "text-zinc-400",   icon: <CheckCircle size={16} className="text-zinc-400" /> },
  cancelled:   { label: "Cancelada",               color: "text-red-400",    icon: <XCircle size={16} className="text-red-400" /> },
};

const NEXT_DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return d;
});

/* ── helpers ────────────────────────────────────────────────────────────── */

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

/* ── Reschedule sub-view ────────────────────────────────────────────────── */

function RescheduleView({
  appt,
  onSuccess,
  onCancel,
}: {
  appt: ApptData;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsReason, setSlotsReason] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSlots = useCallback(
    async (date: Date) => {
      setLoadingSlots(true);
      setSlots([]);
      setSelectedTime(null);
      const dateStr = date.toISOString().slice(0, 10);
      const res = await fetch(
        `/api/public/availability?barberId=${appt.barber.id}&date=${dateStr}&serviceId=${appt.service.id}&tenantSlug=${appt.tenantSlug}`,
      );
      const json = await res.json();
      setSlots(json.data?.slots ?? []);
      setSlotsReason(json.data?.reason ?? null);
      setLoadingSlots(false);
    },
    [appt.barber.id, appt.service.id, appt.tenantSlug],
  );

  const handleDateSelect = (d: Date) => {
    setSelectedDate(d);
    loadSlots(d);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setSaving(true);
    setError("");
    const [h, m] = selectedTime.split(":").map(Number);
    const startsAt = new Date(selectedDate);
    startsAt.setHours(h, m, 0, 0);

    const res = await fetch(`/api/public/appointments/${appt.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reschedule", startsAt: startsAt.toISOString() }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Error al reagendar"); return; }
    onSuccess();
  };

  const [calPage, setCalPage] = useState(0);
  const visibleDays = NEXT_DAYS.slice(calPage * 6, calPage * 6 + 6);

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <button onClick={onCancel} className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300">
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-[15px] font-semibold text-zinc-100">Elegir nueva fecha</h2>
      </div>

      {/* Date picker */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">Fecha</span>
          <div className="flex gap-1">
            <button
              onClick={() => setCalPage((p) => Math.max(0, p - 1))}
              disabled={calPage === 0}
              className="rounded-md p-1 text-zinc-600 disabled:opacity-30 hover:text-zinc-300"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => setCalPage((p) => Math.min(1, p + 1))}
              disabled={calPage === 1}
              className="rounded-md p-1 text-zinc-600 disabled:opacity-30 hover:text-zinc-300"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {visibleDays.map((d) => {
            const isSel = selectedDate?.toDateString() === d.toDateString();
            return (
              <button
                key={d.toISOString()}
                onClick={() => handleDateSelect(d)}
                className={[
                  "rounded-xl border py-3 text-center transition-all",
                  isSel
                    ? "border-gold bg-gold-subtle text-gold-light"
                    : "border-white/[0.06] bg-zinc-900/60 text-zinc-400 hover:border-gold-b hover:text-zinc-200",
                ].join(" ")}
              >
                <div className="text-[10px] font-medium uppercase">
                  {d.toLocaleDateString("es-CO", { weekday: "short" })}
                </div>
                <div className="mt-0.5 text-[18px] font-semibold">{d.getDate()}</div>
                <div className="text-[9px] text-zinc-600">
                  {d.toLocaleDateString("es-CO", { month: "short" })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      {selectedDate && (
        <div className="mb-5">
          <span className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
            Horario disponible
          </span>
          {loadingSlots ? (
            <div className="flex justify-center py-5">
              <Loader2 size={20} className="animate-spin text-zinc-600" />
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-xl border border-white/[0.06] bg-zinc-900/40 py-4 text-center text-[13px] text-zinc-500">
              {slotsReason ?? "Sin horarios disponibles este día"}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedTime(s)}
                  className={[
                    "rounded-xl border py-2.5 text-[13px] font-medium transition-all",
                    selectedTime === s
                      ? "border-gold bg-gold-subtle text-gold-light"
                      : "border-white/[0.05] bg-zinc-900/60 text-zinc-500 hover:border-gold-b hover:text-zinc-200",
                  ].join(" ")}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!selectedDate || !selectedTime || saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-subtle border border-gold-b py-3.5 text-[14px] font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] disabled:cursor-not-allowed disabled:opacity-30"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : null}
        {saving ? "Guardando..." : "Confirmar nueva fecha →"}
      </button>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */

export default function MiCitaPage() {
  const { id } = useParams<{ id: string }>();
  const [appt, setAppt] = useState<ApptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"detail" | "cancel" | "reschedule" | "cancelled" | "rescheduled">("detail");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await fetch(`/api/public/appointments/${id}`);
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Cita no encontrada"); }
    else { setAppt(json.data); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    if (!appt) return;
    setCancelling(true);
    setActionError("");
    const res = await fetch(`/api/public/appointments/${appt.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", reason: cancelReason || undefined }),
    });
    const json = await res.json();
    setCancelling(false);
    if (!res.ok) { setActionError(json.error ?? "Error al cancelar"); return; }
    setView("cancelled");
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin text-zinc-500" size={28} />
      </div>
    );
  }

  /* ── not found ── */
  if (error || !appt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
          <p className="text-zinc-300">{error || "Cita no encontrada"}</p>
        </div>
      </div>
    );
  }

  const { date, time } = fmtDateTime(appt.startsAt);
  const statusCfg = STATUS_LABEL[appt.status] ?? STATUS_LABEL.pending;
  const mapsUrl = appt.barbershop.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${appt.barbershop.name} ${appt.barbershop.address} ${appt.barbershop.city ?? ""}`,
      )}`
    : null;

  /* ── cancelled confirmation ── */
  if (view === "cancelled") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-sm text-center">
          <XCircle size={52} className="mx-auto mb-4 text-red-400" />
          <h1 className="text-xl font-semibold text-zinc-100">Cita cancelada</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Tu cita en {appt.barbershop.name} ha sido cancelada. Puedes reservar una nueva cuando quieras.
          </p>
          {appt.tenantSlug && (
            <a
              href={`/reservar?tenantSlug=${appt.tenantSlug}`}
              className="mt-6 block w-full rounded-xl border border-gold-b bg-gold-subtle py-3 text-[14px] font-medium text-gold-light text-center hover:bg-[rgba(201,168,76,0.18)] transition"
            >
              Reservar nueva cita
            </a>
          )}
        </div>
      </div>
    );
  }

  /* ── rescheduled confirmation ── */
  if (view === "rescheduled") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-sm text-center">
          <CheckCircle size={52} className="mx-auto mb-4 text-emerald-400" />
          <h1 className="text-xl font-semibold text-zinc-100">¡Cita reagendada!</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Tu cita ha sido actualizada. Recibirás confirmación por WhatsApp.
          </p>
          <button
            onClick={() => { load(); setView("detail"); }}
            className="mt-6 flex items-center justify-center gap-2 w-full rounded-xl border border-white/[0.08] py-3 text-[13px] text-zinc-400 hover:text-zinc-200 transition"
          >
            <RefreshCw size={14} />
            Ver mi cita actualizada
          </button>
        </div>
      </div>
    );
  }

  /* ── reschedule view ── */
  if (view === "reschedule") {
    return (
      <div className="min-h-screen bg-zinc-950 p-5">
        <div className="mx-auto w-full max-w-sm pt-6">
          <RescheduleView
            appt={appt}
            onSuccess={() => setView("rescheduled")}
            onCancel={() => setView("detail")}
          />
        </div>
      </div>
    );
  }

  /* ── detail view ── */
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto w-full max-w-sm px-5 pt-10 pb-16">

        {/* Header barbershop */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300">
            {getInitials(appt.barbershop.name)}
          </div>
          <p className="text-[12px] text-zinc-500">{appt.barbershop.name}</p>
          <h1 className="mt-0.5 text-[22px] font-semibold text-zinc-100">Tu cita</h1>
        </div>

        {/* Status badge */}
        <div className={`mb-5 flex items-center justify-center gap-2 rounded-full border px-4 py-2 ${
          appt.status === "confirmed" ? "border-emerald-400/20 bg-emerald-400/[0.06]"
          : appt.status === "cancelled" ? "border-red-400/20 bg-red-400/[0.06]"
          : appt.status === "completed" ? "border-zinc-600/30 bg-zinc-800/40"
          : "border-amber-400/20 bg-amber-400/[0.06]"
        }`}>
          {statusCfg.icon}
          <span className={`text-[13px] font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
        </div>

        {/* Date & time card */}
        <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
            <CalendarDays size={12} />
            Fecha y hora
          </div>
          <p className="text-[17px] font-semibold capitalize text-zinc-100">{date}</p>
          <p className="mt-1 text-[24px] font-bold tracking-tight text-gold-light">{time}</p>
        </div>

        {/* Barber card */}
        <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            {appt.barber.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={appt.barber.photoUrl}
                alt={appt.barber.name}
                className="h-12 w-12 rounded-full object-cover border border-white/[0.08]"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-b bg-[#2A2116] text-[13px] font-semibold text-gold-light">
                {getInitials(appt.barber.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-zinc-100">{appt.barber.name}</p>
                {appt.barber.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-[11px] text-amber-300">
                    <Star size={10} fill="#FCD34D" stroke="#FCD34D" />
                    {appt.barber.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-zinc-500">{appt.barber.specialty ?? "Barbero"}</p>
            </div>
          </div>
        </div>

        {/* Service + price */}
        <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors size={14} className="text-zinc-500" />
              <div>
                <p className="text-[13px] font-medium text-zinc-200">{appt.service.name}</p>
                <p className="text-[11px] text-zinc-500">{appt.service.durationMin} min</p>
              </div>
            </div>
            <p className="text-[16px] font-semibold text-gold-light">{formatCOP(appt.total)}</p>
          </div>
        </div>

        {/* Location */}
        {(appt.barbershop.address || appt.barbershop.city) && (
          <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 shrink-0 text-zinc-500" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-zinc-300">
                  {[appt.barbershop.address, appt.barbershop.city].filter(Boolean).join(", ")}
                </p>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-[11.5px] text-gold underline-offset-2 hover:underline"
                  >
                    Ver en Google Maps →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cancel reason if cancelled */}
        {appt.status === "cancelled" && appt.cancelReason && (
          <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-[12.5px] text-red-300">
            Motivo: {appt.cancelReason}
          </div>
        )}

        {/* WhatsApp contact */}
        {appt.barbershop.whatsapp && (
          <a
            href={`https://wa.me/${appt.barbershop.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, tengo una cita el ${date} a las ${time}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] py-3 text-[13px] text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-200"
          >
            <Phone size={14} />
            Contactar al negocio
          </a>
        )}

        {/* Cancel confirmation sub-view */}
        {view === "cancel" && (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-4">
            <p className="mb-3 text-[13px] font-medium text-red-300">
              ¿Confirmas que quieres cancelar esta cita?
            </p>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motivo (opcional)"
              className="mb-3 w-full resize-none rounded-xl border border-white/[0.06] bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-400/40 placeholder:text-zinc-600"
            />
            {actionError && (
              <p className="mb-2 text-[12px] text-red-400">{actionError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setView("detail")}
                className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-[13px] text-zinc-400 hover:text-zinc-200"
              >
                No, mantener
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-400/30 bg-red-400/10 py-2.5 text-[13px] font-medium text-red-300 hover:bg-red-400/20 disabled:opacity-40"
              >
                {cancelling ? <Loader2 size={13} className="animate-spin" /> : null}
                {cancelling ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {view === "detail" && (
          <div className="space-y-2">
            {appt.canReschedule && (
              <button
                onClick={() => setView("reschedule")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-b bg-gold-subtle py-3.5 text-[14px] font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)]"
              >
                <RefreshCw size={15} />
                Reagendar cita
              </button>
            )}
            {appt.canCancel && (
              <button
                onClick={() => setView("cancel")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.06] py-3 text-[13px] font-medium text-red-400 transition hover:bg-red-400/10"
              >
                <XCircle size={14} />
                Cancelar cita
              </button>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-zinc-700">
          Powered by <span className="text-gold/50 font-medium tracking-wider">VANTTAGE</span>
        </p>
      </div>
    </div>
  );
}

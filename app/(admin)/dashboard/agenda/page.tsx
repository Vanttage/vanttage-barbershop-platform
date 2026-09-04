"use client";

import { useState, useMemo, useEffect } from "react";
import Header from "@/src/components/admin/dashboard/Header";
import { apiCall, useApiList, useApiPaginated } from "@/src/hooks/useApi";
import { formatCOP, STATUS_CONFIG } from "@/src/types";
import type {
  AppointmentWithRelations,
  AppointmentStatus,
  Barber,
  Service,
  ClientBasic,
} from "@/src/types";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar,
  Clock,
  Scissors,
  User,
  Phone,
  CheckCircle,
  XCircle,
  PlayCircle,
  Circle,
  CheckCheck,
  AlertTriangle,
  CalendarDays,
  LayoutList,
  Search,
  CalendarClock,
} from "lucide-react";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

/** Debounce simple: retrasa la actualización de un valor N ms tras el último cambio. */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// Formatea dígitos crudos ("35000") como miles legibles ("35.000").
function formatThousands(digits: string): string {
  if (!digits) return "";
  return new Intl.NumberFormat("es-CO").format(Number(digits));
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

function getWeekDays(anchor: Date): Date[] {
  const day = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmtShort(d: Date) {
  return d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric" });
}

function isToday(d: Date) {
  const t = new Date();
  return d.toDateString() === t.toDateString();
}

const STATUS_ICON: Record<AppointmentStatus, React.ReactNode> = {
  pending: <Circle size={14} className="text-amber-400" />,
  confirmed: <CheckCircle size={14} className="text-emerald-400" />,
  in_progress: <PlayCircle size={14} className="text-blue-400" />,
  completed: <CheckCheck size={14} className="text-zinc-400" />,
  cancelled: <XCircle size={14} className="text-red-400" />,
};

function NewApptModal({
  onClose,
  barbers,
  services,
  defaultDate,
}: {
  onClose: () => void;
  barbers: Barber[];
  services: Service[];
  defaultDate: string;
}) {
  const [form, setForm] = useState({
    clientId: "",
    clientName: "",
    clientPhone: "",
    barberId: "",
    serviceId: "",
    date: defaultDate,
    time: "10:00",
  });
  const [clientQuery, setClientQuery] = useState("");
  const [showClientResults, setShowClientResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const debouncedQuery = useDebounced(clientQuery, 300);
  const { data: clientResults, loading: searchingClients } = useApiPaginated<ClientBasic>(
    debouncedQuery.trim().length >= 2
      ? `/api/clients?search=${encodeURIComponent(debouncedQuery.trim())}&limit=6`
      : "",
  );

  const svc = services.find((s) => s.id === form.serviceId);

  function selectClient(c: ClientBasic) {
    setForm((p) => ({ ...p, clientId: c.id, clientName: c.name, clientPhone: c.phone }));
    setClientQuery("");
    setShowClientResults(false);
  }

  function clearClient() {
    setForm((p) => ({ ...p, clientId: "", clientName: "", clientPhone: "" }));
    setClientQuery("");
  }

  const handleSubmit = async () => {
    if (
      !form.clientName ||
      !form.clientPhone ||
      !form.barberId ||
      !form.serviceId ||
      !form.date ||
      !form.time
    ) {
      setError("Completa todos los campos");
      return;
    }
    setLoading(true);
    const startsAt = new Date(`${form.date}T${form.time}:00`);
    const { error: err } = await apiCall("/api/appointments", "POST", {
      barberId: form.barberId,
      serviceId: form.serviceId,
      // Si se eligió un cliente existente, mandamos su id — evita crear un
      // registro duplicado si el nombre/telefono no coinciden exacto.
      ...(form.clientId
        ? { clientId: form.clientId }
        : { clientName: form.clientName, clientPhone: form.clientPhone }),
      startsAt: startsAt.toISOString(),
    });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#18181C] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="font-display text-base font-semibold text-zinc-100">
            Nueva cita
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div>
            <label className="mb-1.5 block text-[10.5px] uppercase tracking-wider text-zinc-500">
              Cliente
            </label>

            {form.clientId ? (
              <div className="flex items-center justify-between rounded-xl border border-gold-border bg-gold-subtle px-4 py-2.5">
                <div>
                  <div className="text-sm font-medium text-zinc-100">{form.clientName}</div>
                  <div className="text-xs text-zinc-500">{form.clientPhone}</div>
                </div>
                <button
                  type="button"
                  onClick={clearClient}
                  className="text-[11.5px] font-medium text-gold-light transition hover:text-gold"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  value={form.clientName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((p) => ({ ...p, clientName: v }));
                    setClientQuery(v);
                    setShowClientResults(true);
                  }}
                  onFocus={() => setShowClientResults(true)}
                  onBlur={() => setTimeout(() => setShowClientResults(false), 150)}
                  placeholder="Buscar cliente o escribir nombre nuevo"
                  className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 py-2.5 pl-9 pr-4 text-sm text-zinc-100 outline-none transition focus:border-gold-border placeholder:text-zinc-600"
                />
                {showClientResults && clientQuery.trim().length >= 2 && (
                  <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#18181C] shadow-xl">
                    {searchingClients ? (
                      <div className="px-4 py-3 text-[12.5px] text-zinc-600">Buscando...</div>
                    ) : clientResults.length === 0 ? (
                      <div className="px-4 py-3 text-[12.5px] text-zinc-600">
                        Sin coincidencias — se creará como cliente nuevo.
                      </div>
                    ) : (
                      clientResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => selectClient(c)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-white/[0.04]"
                        >
                          <span className="text-[13px] text-zinc-200">{c.name}</span>
                          <span className="text-[11.5px] text-zinc-500">{c.phone}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {!form.clientId && (
            <div>
              <label className="mb-1.5 block text-[10.5px] uppercase tracking-wider text-zinc-500">
                WhatsApp
              </label>
              <input
                value={form.clientPhone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clientPhone: e.target.value }))
                }
                placeholder="+57 300 000 0000"
                className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-gold-border placeholder:text-zinc-600"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[10.5px] uppercase tracking-wider text-zinc-500">
                Barbero
              </label>
              <select
                value={form.barberId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, barberId: e.target.value }))
                }
                className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold-border"
              >
                <option value="">Seleccionar...</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name.split(" ")[0]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10.5px] uppercase tracking-wider text-zinc-500">
                Servicio
              </label>
              <select
                value={form.serviceId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, serviceId: e.target.value }))
                }
                className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold-border"
              >
                <option value="">Seleccionar...</option>
                {services
                  .filter((s) => s.active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[10.5px] uppercase tracking-wider text-zinc-500">
                Fecha
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
                className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold-border"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10.5px] uppercase tracking-wider text-zinc-500">
                Hora
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) =>
                  setForm((p) => ({ ...p, time: e.target.value }))
                }
                className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold-border"
              />
            </div>
          </div>
          {svc && (
            <div className="flex items-center justify-between rounded-xl border border-gold-border bg-gold-subtle px-4 py-2.5">
              <span className="text-[12.5px] text-zinc-400">
                {svc.name} · {svc.durationMin} min
              </span>
              <span className="text-[13px] font-semibold text-gold-light">
                {formatCOP(svc.price)}
              </span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-white/[0.06] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-xl border border-gold-border bg-gold-subtle py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Confirmar cita"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApptDetailModal({
  appt,
  barbers,
  services,
  onClose,
  onUpdated,
}: {
  appt: AppointmentWithRelations;
  barbers: Barber[];
  services: Service[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [error, setError] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completeServiceId, setCompleteServiceId] = useState(appt.serviceId);
  const [completePrice, setCompletePrice] = useState(String(appt.price));

  const apptStart = new Date(appt.startsAt);
  const [resched, setResched] = useState({
    date: apptStart.toISOString().slice(0, 10),
    time: apptStart.toTimeString().slice(0, 5),
    barberId: appt.barberId,
    serviceId: appt.serviceId,
  });

  const canReschedule = appt.status === "pending" || appt.status === "confirmed";

  const updateStatus = async (status: AppointmentStatus) => {
    setLoading(true);
    setError("");
    const body: Record<string, string> = { status };
    if (status === "cancelled" && cancelReason)
      body.cancelReason = cancelReason;
    const { error: err } = await apiCall(
      `/api/appointments/${appt.id}`,
      "PATCH",
      body,
    );
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    onUpdated();
  };

  const completeAppointment = async () => {
    setLoading(true);
    setError("");
    const body: Record<string, unknown> = { status: "completed" };
    if (completeServiceId !== appt.serviceId) body.serviceId = completeServiceId;
    const priceNum = Number(completePrice || 0);
    if (priceNum !== appt.price) body.finalPrice = priceNum;
    const { error: err } = await apiCall(`/api/appointments/${appt.id}`, "PATCH", body);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    onUpdated();
  };

  const saveReschedule = async () => {
    setLoading(true);
    setError("");
    const startsAt = new Date(`${resched.date}T${resched.time}:00`);
    const { error: err } = await apiCall(`/api/appointments/${appt.id}`, "PATCH", {
      startsAt: startsAt.toISOString(),
      barberId: resched.barberId,
      serviceId: resched.serviceId,
    });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    onUpdated();
  };

  const cfg = STATUS_CONFIG[appt.status];
  const startDate = new Date(appt.startsAt);
  const endDate = new Date(appt.endsAt);

  const nextActions: {
    label: string;
    status: AppointmentStatus;
    className: string;
  }[] = [];
  if (appt.status === "pending") {
    nextActions.push({
      label: "Confirmar",
      status: "confirmed",
      className:
        "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20",
    });
    nextActions.push({
      label: "Cancelar cita",
      status: "cancelled",
      className:
        "border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/20",
    });
  }
  if (appt.status === "confirmed") {
    nextActions.push({
      label: "Iniciar atencion",
      status: "in_progress",
      className:
        "border-blue-400/30 bg-blue-400/10 text-blue-300 hover:bg-blue-400/20",
    });
    nextActions.push({
      label: "Cancelar cita",
      status: "cancelled",
      className:
        "border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/20",
    });
  }
  if (appt.status === "in_progress") {
    nextActions.push({
      label: "Completar",
      status: "completed",
      className:
        "border-zinc-400/30 bg-zinc-400/10 text-zinc-300 hover:bg-zinc-400/20",
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#18181C] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-2">
            {STATUS_ICON[appt.status]}
            <span className="text-sm font-medium" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {canReschedule && (
              <button
                type="button"
                onClick={() => setRescheduling((v) => !v)}
                title="Reprogramar"
                className={`rounded-lg p-1.5 transition hover:bg-white/[0.04] hover:text-zinc-200 ${rescheduling ? "text-gold-light" : "text-zinc-500"}`}
              >
                <CalendarClock size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Client */}
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-zinc-800 text-[11px] font-semibold text-zinc-300">
              {appt.client.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-100">
                {appt.client.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                <Phone size={11} />
                {appt.client.phone}
              </div>
            </div>
          </div>

          {rescheduling ? (
            /* Reschedule form */
            <div className="mb-5 flex flex-col gap-3 rounded-xl border border-gold-border bg-gold-subtle/40 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={resched.date}
                    onChange={(e) => setResched((p) => ({ ...p, date: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold-border"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={resched.time}
                    onChange={(e) => setResched((p) => ({ ...p, time: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold-border"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                    Barbero
                  </label>
                  <select
                    value={resched.barberId}
                    onChange={(e) => setResched((p) => ({ ...p, barberId: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold-border"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                    Servicio
                  </label>
                  <select
                    value={resched.serviceId}
                    onChange={(e) => setResched((p) => ({ ...p, serviceId: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold-border"
                  >
                    {services.filter((s) => s.active || s.id === resched.serviceId).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduling(false)}
                  className="flex-1 rounded-lg border border-white/[0.08] py-2 text-[12.5px] text-zinc-400 transition hover:text-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveReschedule}
                  disabled={loading}
                  className="flex-1 rounded-lg border border-gold-border bg-gold-subtle py-2 text-[12.5px] font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          ) : (
            /* Details grid */
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.04] bg-zinc-800/40 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-600">
                  <Scissors size={10} />
                  Servicio
                </div>
                <div className="text-sm font-medium text-zinc-200">
                  {appt.service.name}
                </div>
                <div className="mt-0.5 text-xs text-gold-light">
                  {formatCOP(appt.price)}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-zinc-800/40 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-600">
                  <User size={10} />
                  Barbero
                </div>
                <div className="text-sm font-medium text-zinc-200">
                  {appt.barber.name}
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {appt.barber.specialty ?? "—"}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-zinc-800/40 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-600">
                  <Calendar size={10} />
                  Fecha
                </div>
                <div className="text-sm font-medium text-zinc-200">
                  {startDate.toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-zinc-800/40 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-600">
                  <Clock size={10} />
                  Horario
                </div>
                <div className="text-sm font-medium text-zinc-200">
                  {startDate.toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" – "}
                  {endDate.toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          )}

          {appt.notes && (
            <p className="mb-4 rounded-xl border border-white/[0.04] bg-zinc-800/40 px-4 py-3 text-xs text-zinc-500">
              {appt.notes}
            </p>
          )}

          {appt.cancelReason && (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-300">
              Cancelada: {appt.cancelReason}
            </div>
          )}

          {/* Cancel reason input */}
          {showCancel && (
            <div className="mb-4">
              <label className="mb-1.5 block text-[10.5px] uppercase tracking-wider text-zinc-500">
                Motivo de cancelacion
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="No se presento, reagendo, etc."
                className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-red-400/50 placeholder:text-zinc-600"
              />
            </div>
          )}

          {/* Confirmar servicio realizado (puede diferir del reservado) */}
          {showComplete && (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-zinc-500/30 bg-zinc-800/30 p-3.5">
              <p className="text-[11.5px] text-zinc-500">
                Confirma qué se hizo realmente. Si fue distinto a lo reservado, corrígelo aquí — esto es lo que se cobrará.
              </p>
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                  Servicio realizado
                </label>
                <select
                  value={completeServiceId}
                  onChange={(e) => {
                    const newSvc = services.find((s) => s.id === e.target.value);
                    setCompleteServiceId(e.target.value);
                    if (newSvc) setCompletePrice(String(newSvc.price));
                  }}
                  className="w-full rounded-lg border border-white/[0.08] bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold-border"
                >
                  {services.filter((s) => s.active || s.id === completeServiceId).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} · {formatCOP(s.price)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                  Precio final a cobrar
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatThousands(completePrice)}
                    onChange={(e) => setCompletePrice(onlyDigits(e.target.value))}
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-900/60 py-2 pl-6 pr-3 text-sm text-zinc-100 outline-none focus:border-gold-border"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Actions */}
          {!rescheduling && nextActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nextActions.map((action) => {
                const isCancelAction = action.status === "cancelled";
                const isCompleteAction = action.status === "completed";
                return (
                  <button
                    key={action.status}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      if (isCancelAction && !showCancel) {
                        setShowCancel(true);
                        return;
                      }
                      if (isCompleteAction && !showComplete) {
                        setShowComplete(true);
                        return;
                      }
                      if (isCompleteAction) {
                        completeAppointment();
                        return;
                      }
                      updateStatus(action.status);
                    }}
                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:opacity-40 ${action.className}`}
                  >
                    {loading ? "..." : isCompleteAction && showComplete ? "Confirmar y finalizar" : action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const [anchor, setAnchor] = useState(new Date());
  const [selectedBarber, setSelectedBarber] = useState("all");
  const [view, setView] = useState<"dia" | "semana" | "lista">("dia");
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [selectedAppt, setSelectedAppt] =
    useState<AppointmentWithRelations | null>(null);

  const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);
  const anchorDateStr = anchor.toISOString().slice(0, 10);
  // Vista día: solo pide ese día. Semana/lista: pide toda la semana.
  const dateFrom = view === "dia" ? anchorDateStr : weekDays[0].toISOString().slice(0, 10);
  const dateTo = view === "dia" ? anchorDateStr : weekDays[6].toISOString().slice(0, 10);

  const {
    data: appointments,
    loading: loadingAppts,
    refetch,
  } = useApiList<AppointmentWithRelations>(
    `/api/appointments?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=200`,
  );
  const { data: barbers } = useApiList<Barber>("/api/barbers");
  const { data: services } = useApiList<Service>("/api/services");

  const filtered =
    selectedBarber === "all"
      ? appointments
      : appointments.filter((a) => a.barberId === selectedBarber);

  const todayAppts = filtered.filter((a) => a.status !== "cancelled");
  const confirmed = filtered.filter((a) => a.status === "confirmed").length;
  const pending = filtered.filter((a) => a.status === "pending").length;
  const ingresoHoy = filtered
    .filter((a) => a.status !== "cancelled")
    .reduce((s, a) => s + a.price, 0);

  const prevWeek = () => {
    const d = new Date(anchor);
    d.setDate(d.getDate() - 7);
    setAnchor(d);
  };
  const nextWeek = () => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + 7);
    setAnchor(d);
  };
  const prevDay = () => {
    const d = new Date(anchor);
    d.setDate(d.getDate() - 1);
    setAnchor(d);
  };
  const nextDay = () => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + 1);
    setAnchor(d);
  };
  const goToday = () => setAnchor(new Date());

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-950">
      <Header title="Agenda" />

      {showNewAppt && (
        <NewApptModal
          onClose={() => {
            setShowNewAppt(false);
            refetch();
          }}
          barbers={barbers}
          services={services}
          defaultDate={new Date().toISOString().slice(0, 10)}
        />
      )}
      {selectedAppt && (
        <ApptDetailModal
          appt={selectedAppt}
          barbers={barbers}
          services={services}
          onClose={() => setSelectedAppt(null)}
          onUpdated={() => {
            setSelectedAppt(null);
            refetch();
          }}
        />
      )}

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-4 py-5 sm:gap-5 sm:px-6 sm:py-6">
        {/* Toolbar — row 1: navegación de semana */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            {/* Nav — día individual o semana, según la vista */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={view === "dia" ? prevDay : prevWeek}
                className="rounded-lg border border-white/[0.06] p-2 text-zinc-500 transition hover:border-white/[0.12] hover:text-zinc-300"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-center text-[13px] font-medium text-zinc-200 sm:min-w-[200px] sm:text-[14px] capitalize">
                {view === "dia" ? (
                  isToday(anchor) ? (
                    "Hoy"
                  ) : (
                    anchor.toLocaleDateString("es-CO", {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    })
                  )
                ) : (
                  <>
                    {weekDays[0].toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                    })}
                    {" – "}
                    {weekDays[6].toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </>
                )}
              </span>
              <button
                onClick={view === "dia" ? nextDay : nextWeek}
                className="rounded-lg border border-white/[0.06] p-2 text-zinc-500 transition hover:border-white/[0.12] hover:text-zinc-300"
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={goToday}
                className="rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-[12px] text-zinc-500 transition hover:border-gold-border hover:text-gold sm:ml-2 sm:px-3"
              >
                Hoy
              </button>
            </div>
            {/* Nueva cita — siempre visible */}
            <button
              onClick={() => setShowNewAppt(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gold-border bg-gold-subtle px-3 py-2 text-[12px] font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] sm:px-4 sm:text-[12.5px]"
            >
              <Plus size={13} />
              <span className="hidden xs:inline sm:inline">Nueva cita</span>
              <span className="xs:hidden sm:hidden">+</span>
            </button>
          </div>

          {/* Row 2: view toggle + barber filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-0.5 rounded-lg border border-white/[0.04] bg-zinc-800/60 p-0.5">
              {(["dia", "semana", "lista"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] capitalize transition sm:px-3 ${
                    view === v
                      ? "border border-white/[0.08] bg-zinc-700 font-medium text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {v === "dia" ? (
                    <Calendar size={12} />
                  ) : v === "semana" ? (
                    <CalendarDays size={12} />
                  ) : (
                    <LayoutList size={12} />
                  )}
                  {v}
                </button>
              ))}
            </div>
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="flex-1 rounded-lg border border-white/[0.06] bg-zinc-800/60 px-3 py-2 text-[12.5px] text-zinc-300 outline-none focus:border-gold-border sm:flex-none"
            >
              <option value="all">Todos los barberos</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats — la query ya trae solo el rango de la vista activa (día o semana) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: view === "dia" ? "Citas hoy" : "Citas semana",
              value: todayAppts.length,
              color: "text-zinc-100",
            },
            {
              label: "Confirmadas",
              value: confirmed,
              color: "text-emerald-400",
            },
            { label: "Pendientes", value: pending, color: "text-amber-400" },
            {
              label: "Ingreso est.",
              value: formatCOP(ingresoHoy),
              color: "text-gold-light",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-white/[0.04] bg-[#111113] px-3 py-3 sm:px-4 sm:py-3.5"
            >
              <div className="text-[10px] uppercase tracking-wider text-zinc-600 sm:text-[10.5px]">
                {label}
              </div>
              <div
                className={`mt-1 text-[18px] font-semibold sm:text-[20px] ${color}`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar / List */}
        <div className="overflow-hidden rounded-xl border border-white/[0.04] bg-[#111113]">
          {loadingAppts ? (
            <div className="flex items-center justify-center py-20 text-[13px] text-zinc-600">
              Cargando agenda...
            </div>
          ) : view === "dia" ? (
            /* Day view — "¿quién viene hoy, a qué hora?" */
            <div>
              {todayAppts.length === 0 ? (
                <div className="py-16 text-center text-[13px] text-zinc-600">
                  No hay citas {isToday(anchor) ? "para hoy" : "para este día"}
                </div>
              ) : (
                HOURS.map((hour) => {
                  const hourAppts = todayAppts
                    .filter((a) => new Date(a.startsAt).getHours() === hour)
                    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
                  if (hourAppts.length === 0) return null;
                  return (
                    <div key={hour} className="flex border-b border-white/[0.03] last:border-b-0">
                      <div className="w-16 flex-shrink-0 border-r border-white/[0.04] px-3 py-3 text-right text-[11px] tabular-nums text-zinc-600">
                        {String(hour).padStart(2, "0")}:00
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-2.5">
                        {hourAppts.map((appt) => {
                          const cfg = STATUS_CONFIG[appt.status];
                          const start = new Date(appt.startsAt);
                          return (
                            <button
                              key={appt.id}
                              type="button"
                              onClick={() => setSelectedAppt(appt)}
                              className="flex items-center justify-between gap-3 rounded-lg border-l-2 px-3 py-2.5 text-left transition hover:opacity-90"
                              style={{ background: cfg.bg, borderLeftColor: cfg.color }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[12.5px] font-semibold tabular-nums text-zinc-300">
                                  {start.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <div>
                                  <div className="text-[13px] font-medium text-zinc-100">{appt.client.name}</div>
                                  <div className="text-[11.5px] text-zinc-500">
                                    {appt.service.name} · {appt.barber.name.split(" ")[0]}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-medium text-gold-light">{formatCOP(appt.price)}</span>
                                <span className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : view === "lista" ? (
            /* List view */
            <div>
              {/* Desktop table header */}
              <div className="hidden grid-cols-[120px_1fr_140px_110px_110px] gap-3 border-b border-white/[0.04] px-5 py-3 sm:grid">
                {["Hora", "Cliente", "Servicio", "Barbero", "Estado"].map(
                  (h) => (
                    <div
                      key={h}
                      className="text-[10px] uppercase tracking-wider text-zinc-600"
                    >
                      {h}
                    </div>
                  ),
                )}
              </div>
              {todayAppts.length === 0 ? (
                <div className="py-16 text-center text-[13px] text-zinc-600">
                  No hay citas esta semana
                </div>
              ) : (
                todayAppts
                  .sort(
                    (a, b) =>
                      new Date(a.startsAt).getTime() -
                      new Date(b.startsAt).getTime(),
                  )
                  .map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status];
                    const start = new Date(appt.startsAt);
                    return (
                      <div
                        key={appt.id}
                        onClick={() => setSelectedAppt(appt)}
                        className="cursor-pointer border-b border-white/[0.03] transition hover:bg-zinc-800/30"
                      >
                        {/* Desktop row */}
                        <div className="hidden grid-cols-[120px_1fr_140px_110px_110px] items-center gap-3 px-5 py-3.5 sm:grid">
                          <div className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-300">
                            <Clock size={12} className="text-zinc-600" />
                            {start.toLocaleTimeString("es-CO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-zinc-100">
                              {appt.client.name}
                            </div>
                            <div className="text-[11px] text-zinc-600">
                              {appt.client.phone}
                            </div>
                          </div>
                          <div className="text-[12.5px] text-zinc-400">
                            {appt.service.name}
                          </div>
                          <div className="text-[12.5px] text-zinc-400">
                            {appt.barber.name.split(" ")[0]}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {STATUS_ICON[appt.status]}
                            <span
                              className="text-[11px] font-medium"
                              style={{ color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                        {/* Mobile card */}
                        <div className="flex items-start justify-between gap-2 px-4 py-3.5 sm:hidden">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-zinc-700 text-[10px] font-medium text-zinc-400">
                              {appt.client.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="text-[13px] font-medium text-zinc-100">
                                {appt.client.name}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                {appt.service.name} ·{" "}
                                {appt.barber.name.split(" ")[0]}
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-[12px] tabular-nums text-zinc-400">
                              {start.toLocaleDateString("es-CO", {
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              ·{" "}
                              {start.toLocaleTimeString("es-CO", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="mt-0.5 flex items-center justify-end gap-1">
                              {STATUS_ICON[appt.status]}
                              <span
                                className="text-[10.5px] font-medium"
                                style={{ color: cfg.color }}
                              >
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          ) : (
            /* Weekly calendar view */
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Day headers */}
                <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-white/[0.04]">
                  <div />
                  {weekDays.map((d, i) => (
                    <div
                      key={i}
                      className={`border-l border-white/[0.04] py-3 text-center text-[12px] font-medium capitalize ${
                        isToday(d) ? "text-gold-light" : "text-zinc-500"
                      }`}
                    >
                      {isToday(d) && (
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle mb-0.5" />
                      )}
                      {fmtShort(d)}
                    </div>
                  ))}
                </div>

                {/* Hour rows */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-white/[0.03] min-h-[52px]"
                  >
                    <div className="flex items-start justify-end pr-2 pt-1.5">
                      <span className="text-[10.5px] tabular-nums text-zinc-700">
                        {hour}:00
                      </span>
                    </div>
                    {weekDays.map((d, dayIdx) => {
                      const cellAppts = todayAppts.filter((a) => {
                        const s = new Date(a.startsAt);
                        return (
                          s.toDateString() === d.toDateString() &&
                          s.getHours() === hour
                        );
                      });
                      return (
                        <div
                          key={dayIdx}
                          className={`border-l border-white/[0.04] px-1 py-1 ${isToday(d) ? "bg-[rgba(201,168,76,0.015)]" : ""}`}
                        >
                          {cellAppts.map((appt) => {
                            const cfg =
                              STATUS_CONFIG[appt.status as AppointmentStatus];
                            return (
                              <button
                                key={appt.id}
                                type="button"
                                onClick={() => setSelectedAppt(appt)}
                                className="mb-1 w-full rounded-md border-l-2 px-1.5 py-1 text-left transition hover:opacity-80"
                                style={{
                                  background: cfg.bg,
                                  borderLeftColor: cfg.color,
                                }}
                              >
                                <div
                                  className="truncate text-[11px] font-semibold"
                                  style={{ color: cfg.color }}
                                >
                                  {appt.client.name.split(" ")[0]}
                                </div>
                                <div className="truncate text-[9.5px] text-zinc-500">
                                  {appt.barber.name.split(" ")[0]}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5">
          <span className="text-[11px] uppercase tracking-wider text-zinc-600">
            Estado:
          </span>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-[12px]"
              style={{ color: cfg.color }}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: cfg.color }}
              />
              {cfg.label}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}

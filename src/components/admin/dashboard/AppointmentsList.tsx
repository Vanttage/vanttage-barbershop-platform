"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApiList, apiCall } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import type { AppointmentWithRelations, AppointmentStatus } from "@/src/types";
import StatusBadge, { STATUS_CLASSES } from "@/src/components/admin/ui/StatusBadge";
import { MoreHorizontal, Plus } from "lucide-react";

const FILTERS: { label: string; value: AppointmentStatus | "all" }[] = [
  { label: "Todas",       value: "all"         },
  { label: "Confirmadas", value: "confirmed"   },
  { label: "Pendientes",  value: "pending"     },
  { label: "En proceso",  value: "in_progress" },
  { label: "Completadas", value: "completed"   },
  { label: "Canceladas",  value: "cancelled"   },
];

const STATUS_ACTIONS: AppointmentStatus[] = ["confirmed", "in_progress", "completed", "cancelled"];

// Fecha de hoy en Colombia (UTC-5) — se evalúa al cargar la página en el navegador.
// Usar Colombia evita que citas vespertinas (p.ej. 8pm CO = 1am UTC siguiente)
// aparezcan en el día incorrecto.
function getColombiaToday(): string {
  const co = new Date(Date.now() - 5 * 60 * 60_000);
  return co.toISOString().slice(0, 10);
}
const today = getColombiaToday();

function getInitials(name: string) {
  return name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatTime(val: string | Date) {
  return new Date(val).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ── Desktop row — memoizado para evitar re-renders cuando otras filas cambian
const AppointmentRow = memo(function AppointmentRow({
  appt,
  onStatusChange,
}: {
  appt: AppointmentWithRelations;
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<void>;
}) {
  const [menu, setMenu] = useState(false);

  return (
    <div className="grid grid-cols-[72px_1fr_130px_90px_110px_36px] items-center gap-3 border-b border-white/[0.03] px-5 py-3.5 transition-colors hover:bg-zinc-800/30">
      {/* Time */}
      <div>
        <p className="tabular-nums text-[13px] font-medium text-zinc-100">{formatTime(appt.startsAt)}</p>
        <p className="mt-0.5 text-[10.5px] text-zinc-600">→ {formatTime(appt.endsAt)}</p>
      </div>

      {/* Client */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-zinc-700 text-[10.5px] font-medium text-zinc-400">
          {getInitials(appt.client.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-zinc-100">{appt.client.name}</p>
          <p className="text-[10.5px] text-zinc-600">{appt.client.phone}</p>
        </div>
      </div>

      {/* Service */}
      <div>
        <p className="truncate text-[12.5px] text-zinc-300">{appt.service.name}</p>
        <p className="mt-0.5 text-[10.5px] text-zinc-600">{appt.service.durationMin} min</p>
      </div>

      {/* Barber */}
      <p className="text-[12px] text-zinc-400">{appt.barber.name.split(" ")[0]}</p>

      {/* Total + status */}
      <div className="text-right">
        <p className="mb-1 text-[13px] font-medium text-zinc-100">{formatCOP(appt.total)}</p>
        <StatusBadge status={appt.status} />
      </div>

      {/* Actions */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenu((o) => !o)}
          className="flex items-center justify-center rounded-md border border-transparent p-1 text-zinc-600 transition hover:border-white/[0.08] hover:text-zinc-300"
        >
          <MoreHorizontal size={14} />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[170px] overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-800 p-1.5 shadow-md">
              {STATUS_ACTIONS.filter((s) => s !== appt.status).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { onStatusChange(appt.id, s); setMenu(false); }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] transition hover:bg-zinc-700 ${STATUS_CLASSES[s].badge.split(" ")[0]}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${STATUS_CLASSES[s].dot}`} />
                  Marcar como {STATUS_CLASSES[s].label.toLowerCase()}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

// ── Mobile card — memoizado ───────────────────────────────────────────────────
const AppointmentCard = memo(function AppointmentCard({
  appt,
  onStatusChange,
}: {
  appt: AppointmentWithRelations;
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<void>;
}) {
  const [menu, setMenu] = useState(false);

  return (
    <div className="border-b border-white/[0.03] px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-zinc-700 text-[10.5px] font-medium text-zinc-400">
            {getInitials(appt.client.name)}
          </div>
          <div>
            <p className="text-[13px] font-medium text-zinc-100">{appt.client.name}</p>
            <p className="text-[11px] text-zinc-500">{appt.service.name} · {appt.service.durationMin} min</p>
          </div>
        </div>
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setMenu((o) => !o)}
            className="flex items-center justify-center rounded-md border border-transparent p-1 text-zinc-600 transition hover:border-white/[0.08] hover:text-zinc-300"
          >
            <MoreHorizontal size={14} />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-800 p-1.5 shadow-md">
                {STATUS_ACTIONS.filter((s) => s !== appt.status).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { onStatusChange(appt.id, s); setMenu(false); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] transition hover:bg-zinc-700 ${STATUS_CLASSES[s].badge.split(" ")[0]}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${STATUS_CLASSES[s].dot}`} />
                    {STATUS_CLASSES[s].label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[11.5px] tabular-nums text-zinc-500">
            {formatTime(appt.startsAt)} – {formatTime(appt.endsAt)}
          </span>
          <span className="text-[11px] text-zinc-600">{appt.barber.name.split(" ")[0]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-medium text-zinc-200">{formatCOP(appt.total)}</span>
          <StatusBadge status={appt.status} />
        </div>
      </div>
    </div>
  );
});

// ── Main component ────────────────────────────────────────────────────────────
export default function AppointmentsList() {
  const router = useRouter();
  const [filter, setFilter] = useState<AppointmentStatus | "all">("all");

  // La URL solo cambia cuando cambia el filtro → useApiList no refetch por otros motivos
  const url = useMemo(
    () => `/api/appointments?date=${today}${filter !== "all" ? `&status=${filter}` : ""}`,
    [filter],
  );

  const { data: appointments, loading, refetch } = useApiList<AppointmentWithRelations>(url);

  // useCallback evita que AppointmentRow/Card se re-rendericen por nueva referencia
  const handleStatusChange = useCallback(
    async (id: string, status: AppointmentStatus) => {
      await apiCall(`/api/appointments/${id}`, "PATCH", { status });
      refetch();
    },
    [refetch],
  );

  // useMemo: los contadores solo se recalculan cuando cambia el array
  const counts = useMemo<Record<AppointmentStatus | "all", number>>(
    () => ({
      all:         appointments.length,
      confirmed:   appointments.filter((a) => a.status === "confirmed").length,
      pending:     appointments.filter((a) => a.status === "pending").length,
      in_progress: appointments.filter((a) => a.status === "in_progress").length,
      completed:   appointments.filter((a) => a.status === "completed").length,
      cancelled:   appointments.filter((a) => a.status === "cancelled").length,
    }),
    [appointments],
  );

  const total = useMemo(
    () => appointments.filter((a) => a.status !== "cancelled").reduce((s, a) => s + a.total, 0),
    [appointments],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.04] bg-[#111113]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-zinc-100">Citas de hoy</h3>
          <p className="mt-0.5 text-[11px] text-zinc-600">
            {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/agenda")}
          className="flex items-center gap-1.5 rounded-lg border border-gold/20 bg-gold-subtle px-3.5 py-1.5 text-[12.5px] font-medium text-gold-light transition hover:bg-gold/[0.18]"
        >
          <Plus size={13} />
          Nueva cita
        </button>
      </div>

      {/* Filter tabs */}
      <div className="no-scrollbar flex gap-0.5 overflow-x-auto border-b border-white/[0.04] px-5 pt-4">
        {FILTERS.map(({ label, value }) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={[
                "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-[12.5px] transition-colors",
                active
                  ? "border-gold font-medium text-gold-light"
                  : "border-transparent text-zinc-500 hover:text-zinc-300",
              ].join(" ")}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-gold-subtle text-gold" : "bg-zinc-800 text-zinc-600"}`}>
                {counts[value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table header — desktop only */}
      <div className="hidden grid-cols-[72px_1fr_130px_90px_110px_36px] gap-3 border-b border-white/[0.04] px-5 py-2.5 md:grid">
        {["Hora", "Cliente", "Servicio", "Barbero", "Total", ""].map((c) => (
          <div key={c} className="text-[10px] font-medium uppercase tracking-[0.05em] text-zinc-600">
            {c}
          </div>
        ))}
      </div>

      {/* Rows */}
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-white/[0.03] px-5 py-4">
            {[72, 200, 120, 90, 100, 36].map((w, j) => (
              <div key={j} className="h-4 animate-pulse rounded bg-zinc-800/60" style={{ width: w }} />
            ))}
          </div>
        ))
      ) : appointments.length === 0 ? (
        <div className="py-12 text-center text-[13px] text-zinc-600">
          No hay citas para hoy
        </div>
      ) : (
        <>
          {/* Desktop table rows */}
          <div className="hidden md:block">
            {appointments.map((a) => (
              <AppointmentRow key={a.id} appt={a} onStatusChange={handleStatusChange} />
            ))}
          </div>
          {/* Mobile cards */}
          <div className="md:hidden">
            {appointments.map((a) => (
              <AppointmentCard key={a.id} appt={a} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.04] bg-zinc-800/20 px-5 py-3.5">
        <span className="text-[12px] text-zinc-600">
          {appointments.length} cita{appointments.length !== 1 ? "s" : ""}
        </span>
        <span className="text-[12px] font-medium text-gold-light">
          Total estimado: {formatCOP(total)}
        </span>
      </div>
    </div>
  );
}

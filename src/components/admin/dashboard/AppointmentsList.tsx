"use client";

import { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApiList, apiCall } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import type { AppointmentWithRelations, AppointmentStatus } from "@/src/types";
import StatusBadge, {
  STATUS_CLASSES,
} from "@/src/components/admin/ui/StatusBadge";
import { MoreHorizontal, Plus, Phone, Clock } from "lucide-react";

/* ---------- config ---------- */

const FILTERS: { label: string; value: AppointmentStatus | "all" }[] = [
  { label: "Todas", value: "all" },
  { label: "Confirmadas", value: "confirmed" },
  { label: "Pendientes", value: "pending" },
  { label: "En proceso", value: "in_progress" },
  { label: "Completadas", value: "completed" },
  { label: "Canceladas", value: "cancelled" },
];

const STATUS_ACTIONS: AppointmentStatus[] = [
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

const REFETCH_INTERVAL_MS = 60_000;

function getColombiaToday(): string {
  const co = new Date(Date.now() - 5 * 60 * 60_000);
  return co.toISOString().slice(0, 10);
}
const today = getColombiaToday();

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(val: string | Date) {
  return new Date(val).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function isNew(createdAt: string | Date): boolean {
  return Date.now() - new Date(createdAt).getTime() < 5 * 60_000;
}

/* ---------- Action Menu (shared) ---------- */

function ActionMenu({
  appt,
  onStatusChange,
}: {
  appt: AppointmentWithRelations;
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<void>;
}) {
  const [menu, setMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setMenu((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
      >
        <MoreHorizontal size={14} />
      </button>

      {menu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 p-1 shadow-xl">
            {STATUS_ACTIONS.filter((s) => s !== appt.status).map((s) => (
              <button
                key={s}
                onClick={() => {
                  onStatusChange(appt.id, s);
                  setMenu(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] transition hover:bg-white/[0.06] ${STATUS_CLASSES[s].badge.split(" ")[0]}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${STATUS_CLASSES[s].dot}`}
                />
                Marcar como {STATUS_CLASSES[s].label.toLowerCase()}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Desktop row ---------- */

const AppointmentRow = memo(function AppointmentRow({
  appt,
  onStatusChange,
}: {
  appt: AppointmentWithRelations;
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<void>;
}) {
  const showNew = appt.status === "pending" && isNew(appt.createdAt);

  return (
    <div className="grid grid-cols-[72px_1fr_140px_100px_120px_36px] items-center gap-3 border-b border-white/[0.04] px-5 py-3.5 transition hover:bg-white/[0.03]">
      {/* Hora */}
      <div>
        <p className="tabular-nums text-[13px] font-semibold text-zinc-100">
          {formatTime(appt.startsAt)}
        </p>
        <p className="mt-0.5 text-[10.5px] text-zinc-500">
          → {formatTime(appt.endsAt)}
        </p>
      </div>

      {/* Cliente */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-semibold text-zinc-300">
          {getInitials(appt.client.name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[13px] font-medium text-zinc-100">
              {appt.client.name}
            </p>
            {showNew && (
              <span className="rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
                Nuevo
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500">{appt.client.phone}</p>
        </div>
      </div>

      {/* Servicio */}
      <div>
        <p className="truncate text-[12.5px] text-zinc-300">
          {appt.service.name}
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          {appt.service.durationMin} min
        </p>
      </div>

      {/* Barbero */}
      <p className="text-[12px] text-zinc-400">
        {appt.barber.name.split(" ")[0]}
      </p>

      {/* Total */}
      <div className="text-right">
        <p className="text-[14px] font-semibold text-zinc-100">
          {formatCOP(appt.total)}
        </p>
        <div className="mt-1 flex justify-end">
          <StatusBadge status={appt.status} />
        </div>
      </div>

      {/* Actions */}
      <ActionMenu appt={appt} onStatusChange={onStatusChange} />
    </div>
  );
});

/* ---------- Mobile card ---------- */

const AppointmentCard = memo(function AppointmentCard({
  appt,
  onStatusChange,
}: {
  appt: AppointmentWithRelations;
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<void>;
}) {
  const showNew = appt.status === "pending" && isNew(appt.createdAt);

  return (
    <div className="border-b border-white/[0.04] px-4 py-3.5 transition hover:bg-white/[0.025]">
      {/* Row 1 – hora + estado + menú */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock size={12} className="shrink-0 text-zinc-500" />
          <span className="tabular-nums text-[13px] font-semibold text-zinc-100">
            {formatTime(appt.startsAt)}
          </span>
          <span className="text-[11px] text-zinc-500">
            → {formatTime(appt.endsAt)}
          </span>
          {showNew && (
            <span className="rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
              Nuevo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={appt.status} />
          <ActionMenu appt={appt} onStatusChange={onStatusChange} />
        </div>
      </div>

      {/* Row 2 – cliente + precio */}
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10.5px] font-semibold text-zinc-300">
            {getInitials(appt.client.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-zinc-100">
              {appt.client.name}
            </p>
            <a
              href={`tel:${appt.client.phone}`}
              className="flex items-center gap-1 text-[11px] text-zinc-500 active:text-zinc-300"
            >
              <Phone size={10} />
              {appt.client.phone}
            </a>
          </div>
        </div>
        <p className="shrink-0 text-[15px] font-semibold text-zinc-100">
          {formatCOP(appt.total)}
        </p>
      </div>

      {/* Row 3 – servicio + barbero */}
      <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-zinc-500">
        <span className="truncate">{appt.service.name}</span>
        <span>·</span>
        <span className="shrink-0">{appt.service.durationMin} min</span>
        <span>·</span>
        <span className="shrink-0">{appt.barber.name.split(" ")[0]}</span>
      </div>
    </div>
  );
});

/* ---------- Main ---------- */

export default function AppointmentsList({
  onPendingCount,
}: {
  onPendingCount?: (n: number) => void;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<AppointmentStatus | "all">("all");

  const url = useMemo(
    () =>
      `/api/appointments?date=${today}${
        filter !== "all" ? `&status=${filter}` : ""
      }`,
    [filter],
  );

  const {
    data: appointments,
    loading,
    refetch,
  } = useApiList<AppointmentWithRelations>(url);

  /* Auto-refetch each minute to catch new bookings */
  useEffect(() => {
    const id = setInterval(refetch, REFETCH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refetch]);

  /* Notify parent about pending count for browser title */
  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === "pending").length,
    [appointments],
  );
  useEffect(() => {
    onPendingCount?.(pendingCount);
  }, [pendingCount, onPendingCount]);

  const handleStatusChange = useCallback(
    async (id: string, status: AppointmentStatus) => {
      await apiCall(`/api/appointments/${id}`, "PATCH", { status });
      refetch();
    },
    [refetch],
  );

  const counts = useMemo(
    () => ({
      all: appointments.length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      pending: appointments.filter((a) => a.status === "pending").length,
      in_progress: appointments.filter((a) => a.status === "in_progress")
        .length,
      completed: appointments.filter((a) => a.status === "completed").length,
      cancelled: appointments.filter((a) => a.status === "cancelled").length,
    }),
    [appointments],
  );

  const total = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== "cancelled")
        .reduce((s, a) => s + a.total, 0),
    [appointments],
  );

  return (
    <section className="overflow-hidden rounded-[26px] border border-white/[0.06] bg-white/[0.035]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-zinc-100">
            Citas de hoy
          </h3>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/agenda")}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3.5 py-1.5 text-[12.5px] font-semibold text-black transition hover:bg-emerald-300"
        >
          <Plus size={13} />
          Nueva cita
        </button>
      </div>

      {/* Filters */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-white/[0.06] px-5 pt-4">
        {FILTERS.map(({ label, value }) => {
          const active = filter === value;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={[
                "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12.5px] transition",
                active
                  ? "border-emerald-400 font-medium text-emerald-300"
                  : "border-transparent text-zinc-500 hover:text-zinc-300",
              ].join(" ")}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  active
                    ? "bg-emerald-400/20 text-emerald-300"
                    : "bg-white/[0.06] text-zinc-500"
                }`}
              >
                {counts[value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table header – desktop only */}
      <div className="hidden grid-cols-[72px_1fr_140px_100px_120px_36px] gap-3 border-b border-white/[0.06] px-5 py-2.5 md:grid">
        {["Hora", "Cliente", "Servicio", "Barbero", "Total", ""].map((c) => (
          <div
            key={c}
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500"
          >
            {c}
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border-b border-white/[0.04] px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/[0.06] animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-white/[0.06] animate-pulse" />
                  <div className="h-2.5 w-20 rounded bg-white/[0.04] animate-pulse" />
                </div>
                <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-[13px] text-zinc-500">
            {filter === "all"
              ? "No hay citas para hoy"
              : `No hay citas ${FILTERS.find((f) => f.value === filter)?.label.toLowerCase() ?? ""}`}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block">
            {appointments.map((a) => (
              <AppointmentRow
                key={a.id}
                appt={a}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
          {/* Mobile */}
          <div className="md:hidden">
            {appointments.map((a) => (
              <AppointmentCard
                key={a.id}
                appt={a}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.06] bg-black/30 px-5 py-3.5">
        <span className="text-[12px] text-zinc-500">
          {appointments.length} cita{appointments.length !== 1 ? "s" : ""}
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
              {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
            </span>
          )}
        </span>
        <span className="text-[13px] font-semibold text-emerald-300">
          Total estimado: {formatCOP(total)}
        </span>
      </div>
    </section>
  );
}

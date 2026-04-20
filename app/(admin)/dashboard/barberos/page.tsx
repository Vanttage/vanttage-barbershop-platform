"use client";

import { useState, useMemo } from "react";
import Header from "@/src/components/admin/dashboard/Header";
import { apiCall, useApiList } from "@/src/hooks/useApi";
import { getInitials } from "@/src/types";
import type { Barber } from "@/src/types";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Power,
  Star,
  Phone,
  Clock,
  Scissors,
  Users,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";

type BarberWithMetrics = Barber & {
  appointmentsToday?: number;
  schedules?: Array<{
    dayOfWeek: number;
    isAvailable: boolean;
    startTime: string;
    endTime: string;
  }>;
};

const DAYS_SHORT = ["D", "L", "M", "X", "J", "V", "S"];
const DAYS_LABEL = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const FIELD_CLASS =
  "w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-gold-b placeholder:text-zinc-600";
const LABEL_CLASS =
  "mb-1.5 block text-[10.5px] uppercase tracking-[0.12em] text-zinc-500";

type BarberFormData = {
  name: string;
  specialty: string;
  phone: string;
  experienceYears: string;
  bio: string;
};

function BarberModal({
  barber,
  onClose,
  onSaved,
}: {
  barber?: BarberWithMetrics;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!barber;
  const [form, setForm] = useState<BarberFormData>({
    name: barber?.name ?? "",
    specialty: barber?.specialty ?? "",
    phone: barber?.phone ?? "",
    experienceYears: String(barber?.experienceYears ?? 0),
    bio: barber?.bio ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof BarberFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      specialty: form.specialty || undefined,
      phone: form.phone || undefined,
      bio: form.bio || undefined,
      experienceYears: Number(form.experienceYears || 0),
    };

    const { error: apiError } = isEdit
      ? await apiCall(`/api/barbers/${barber.id}`, "PATCH", payload)
      : await apiCall("/api/barbers", "POST", payload);

    setSaving(false);
    if (apiError) { setError(apiError); return; }
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#18181C] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-100">
              {isEdit ? "Editar barbero" : "Nuevo barbero"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {isEdit ? "Actualiza los datos del perfil operativo." : "Crea un perfil para asignar citas y horarios."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>Nombre completo</label>
            <input value={form.name} onChange={set("name")} placeholder="Carlos Ramirez" className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Especialidad</label>
            <input value={form.specialty} onChange={set("specialty")} placeholder="Fade, barba, clasico" className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Telefono</label>
            <input value={form.phone} onChange={set("phone")} placeholder="+57 300 000 0000" className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Anos de experiencia</label>
            <input type="number" min="0" max="60" value={form.experienceYears} onChange={set("experienceYears")} className={FIELD_CLASS} />
          </div>
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>Biografia</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={set("bio")}
              placeholder="Perfil profesional, estilo de corte y fortalezas."
              className={FIELD_CLASS}
            />
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <div className="flex gap-3 border-t border-white/[0.06] px-6 py-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-400 transition hover:border-white/[0.16] hover:text-zinc-200">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl border border-gold-b bg-gold-subtle px-4 py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear barbero"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({
  barber,
  onClose,
  onDeleted,
}: {
  barber: BarberWithMetrics;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    const { error: err } = await apiCall(`/api/barbers/${barber.id}`, "DELETE");
    setLoading(false);
    if (err) { setError(err); return; }
    onDeleted();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#18181C] p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10">
          <Trash2 size={20} className="text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-zinc-100">Desactivar barbero</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Se desactivara el perfil de <span className="font-medium text-zinc-300">{barber.name}</span>. No podra recibir nuevas citas. Esta accion es reversible.
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-400 transition hover:text-zinc-200">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-400/20 disabled:opacity-40"
          >
            {loading ? "Desactivando..." : "Desactivar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BarberCard({
  barber,
  onEdit,
  onDelete,
  onToggle,
}: {
  barber: BarberWithMetrics;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const activeDays = barber.schedules?.filter((s) => s.isAvailable).map((s) => s.dayOfWeek) ?? [1, 2, 3, 4, 5, 6];

  return (
    <article className="group relative flex flex-col rounded-2xl border border-white/[0.05] bg-[#111113] p-5 transition hover:border-white/[0.10]">
      {/* Actions */}
      <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          title="Editar"
          className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={onToggle}
          title={barber.active ? "Desactivar" : "Activar"}
          className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
        >
          <Power size={13} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Eliminar"
          className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-400/10 hover:text-red-400"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Avatar + Info */}
      <div className="mb-4 flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold-b bg-[#2A2116] text-base font-semibold text-gold-light">
            {getInitials(barber.name)}
          </div>
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111113] ${
              barber.active ? "bg-emerald-400" : "bg-zinc-600"
            }`}
          />
        </div>
        <div className="min-w-0 flex-1 pr-16">
          <h3 className="truncate text-sm font-semibold text-zinc-100">{barber.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
            <Scissors size={10} />
            {barber.specialty ?? "Barbero general"}
          </p>
          {barber.phone && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-600">
              <Phone size={10} />
              {barber.phone}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-zinc-800/50 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[13px] font-semibold text-gold-light">
            <CalendarCheck size={11} />
            {barber.appointmentsToday ?? 0}
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wide text-zinc-600">Hoy</div>
        </div>
        <div className="rounded-xl bg-zinc-800/50 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[13px] font-semibold text-zinc-300">
            <Clock size={11} />
            {barber.experienceYears ?? 0}a
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wide text-zinc-600">Exp.</div>
        </div>
        <div className="rounded-xl bg-zinc-800/50 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[13px] font-semibold text-amber-300">
            <Star size={10} />
            {barber.rating?.toFixed(1) ?? "—"}
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wide text-zinc-600">Rating</div>
        </div>
      </div>

      {/* Weekly schedule */}
      <div>
        <p className="mb-2 text-[9.5px] uppercase tracking-[0.14em] text-zinc-600">Dias disponibles</p>
        <div className="grid grid-cols-7 gap-1">
          {DAYS_SHORT.map((day, idx) => {
            const available = activeDays.includes(idx);
            return (
              <div
                key={day}
                title={DAYS_LABEL[idx]}
                className={`flex h-7 items-center justify-center rounded-md text-[9.5px] font-semibold ${
                  available
                    ? "bg-gold-subtle text-gold-light"
                    : "bg-zinc-800/40 text-zinc-700"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status badge */}
      <div className="mt-4 flex items-center justify-between">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            barber.active
              ? "bg-emerald-400/10 text-emerald-400"
              : "bg-zinc-700/60 text-zinc-500"
          }`}
        >
          {barber.active ? "Activo" : "Inactivo"}
        </span>
        {barber.bio && (
          <p className="line-clamp-1 max-w-[60%] text-right text-[10.5px] text-zinc-600">
            {barber.bio}
          </p>
        )}
      </div>
    </article>
  );
}

export default function BarberosPage() {
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<BarberWithMetrics | null>(null);

  const { data: barbers, loading, refetch } =
    useApiList<BarberWithMetrics>("/api/barbers?active=false");

  const metrics = useMemo(() => {
    const active = barbers.filter((b) => b.active).length;
    const totalAppts = barbers.reduce((s, b) => s + (b.appointmentsToday ?? 0), 0);
    const avgExp =
      barbers.length > 0
        ? Math.round(barbers.reduce((s, b) => s + (b.experienceYears ?? 0), 0) / barbers.length)
        : 0;
    return { active, inactive: barbers.length - active, totalAppts, avgExp };
  }, [barbers]);

  const openEdit = (b: BarberWithMetrics) => { setSelected(b); setModal("edit"); };
  const openDelete = (b: BarberWithMetrics) => { setSelected(b); setModal("delete"); };

  const toggleActive = async (b: BarberWithMetrics) => {
    await apiCall(`/api/barbers/${b.id}`, "PATCH", { active: !b.active });
    refetch();
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-950">
      <Header title="Barberos" />

      {modal === "create" && (
        <BarberModal onClose={closeModal} onSaved={() => { closeModal(); refetch(); }} />
      )}
      {modal === "edit" && selected && (
        <BarberModal barber={selected} onClose={closeModal} onSaved={() => { closeModal(); refetch(); }} />
      )}
      {modal === "delete" && selected && (
        <DeleteConfirm barber={selected} onClose={closeModal} onDeleted={() => { closeModal(); refetch(); }} />
      )}

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 py-5 sm:px-7 sm:py-6">
        {/* Metrics */}
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Activos", value: metrics.active, icon: Users, color: "text-emerald-400" },
            { label: "Inactivos", value: metrics.inactive, icon: Power, color: "text-zinc-500" },
            { label: "Citas hoy", value: metrics.totalAppts, icon: CalendarCheck, color: "text-gold-light" },
            { label: "Exp. promedio", value: `${metrics.avgExp} anos`, icon: Clock, color: "text-blue-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-4 rounded-xl border border-white/[0.04] bg-[#111113] px-5 py-4">
              <div className="rounded-lg border border-white/[0.05] bg-zinc-800/60 p-2.5">
                <Icon size={16} className={color} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
                <div className={`text-xl font-semibold ${color}`}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.05] bg-[#111113] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Equipo operativo</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Gestiona el staff disponible para reservas, agenda y reportes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal("create")}
            className="flex items-center gap-2 rounded-xl border border-gold-b bg-gold-subtle px-4 py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)]"
          >
            <Plus size={14} />
            Agregar barbero
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-zinc-800/40" />
            ))}
          </div>
        ) : barbers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {barbers.map((b) => (
              <BarberCard
                key={b.id}
                barber={b}
                onEdit={() => openEdit(b)}
                onDelete={() => openDelete(b)}
                onToggle={() => toggleActive(b)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.08] bg-zinc-900/30 px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.06] bg-zinc-800/60">
              <Scissors size={22} className="text-zinc-500" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200">Sin barberos registrados</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Crea el primer perfil del equipo para habilitar reservas.
            </p>
            <button
              type="button"
              onClick={() => setModal("create")}
              className="mt-5 flex items-center gap-2 mx-auto rounded-xl border border-gold-b bg-gold-subtle px-4 py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)]"
            >
              <Plus size={14} />
              Crear primer barbero
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

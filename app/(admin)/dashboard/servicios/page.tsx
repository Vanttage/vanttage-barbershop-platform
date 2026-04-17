"use client";

import { useMemo, useState } from "react";
import Header from "@/src/components/admin/dashboard/Header";
import { apiCall, useApiList } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import type { Service } from "@/src/types";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Power,
  Clock,
  Tag,
  Layers,
  TrendingUp,
  AlertTriangle,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type ServiceRow = Service & {
  category?: { id: string; name: string } | null;
};

const FIELD_CLASS =
  "w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-gold-b placeholder:text-zinc-600";
const LABEL_CLASS =
  "mb-1.5 block text-[10.5px] uppercase tracking-[0.12em] text-zinc-500";

type ServiceFormData = {
  name: string;
  durationMin: string;
  price: string;
  description: string;
};

function ServiceModal({
  service,
  onClose,
  onSaved,
}: {
  service?: ServiceRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!service;
  const [form, setForm] = useState<ServiceFormData>({
    name: service?.name ?? "",
    durationMin: String(service?.durationMin ?? 45),
    price: String(service?.price ?? 35000),
    description: service?.description ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof ServiceFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    const dur = Number(form.durationMin);
    const price = Number(form.price);
    if (isNaN(dur) || dur < 15 || dur > 480) { setError("Duracion debe ser entre 15 y 480 minutos"); return; }
    if (isNaN(price) || price < 0) { setError("Precio invalido"); return; }

    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      durationMin: dur,
      price,
      description: form.description.trim() || undefined,
    };

    const { error: apiError } = isEdit
      ? await apiCall(`/api/services/${service.id}`, "PATCH", payload)
      : await apiCall("/api/services", "POST", payload);

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
              {isEdit ? "Editar servicio" : "Nuevo servicio"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {isEdit ? "Actualiza el servicio del catalogo." : "Agrega un servicio para habilitar reservas."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>Nombre del servicio</label>
            <input value={form.name} onChange={set("name")} placeholder="Corte premium fade" className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Duracion (minutos)</label>
            <input type="number" min="15" max="480" step="5" value={form.durationMin} onChange={set("durationMin")} className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Precio (COP)</label>
            <input type="number" min="0" step="1000" value={form.price} onChange={set("price")} className={FIELD_CLASS} />
          </div>
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>Descripcion (opcional)</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={set("description")}
              placeholder="Describe el valor del servicio, productos incluidos o notas relevantes."
              className={FIELD_CLASS}
            />
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            <AlertTriangle size={14} /> {error}
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
            className="flex-1 rounded-xl border border-gold-b bg-gold-subtle px-4 py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] disabled:opacity-40"
          >
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear servicio"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({
  service,
  onClose,
  onDeleted,
}: {
  service: ServiceRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    const { error: err } = await apiCall(`/api/services/${service.id}`, "DELETE");
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
        <h3 className="text-base font-semibold text-zinc-100">Desactivar servicio</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Se pausara <span className="font-medium text-zinc-300">"{service.name}"</span>. No aparecera en la vitrina publica ni en nuevas reservas.
        </p>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
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

export default function ServiciosPage() {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<ServiceRow | null>(null);

  const { data: services, loading, refetch } = useApiList<ServiceRow>("/api/services?active=false");

  const filtered = useMemo(() =>
    services.filter((s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.name?.toLowerCase().includes(search.toLowerCase()),
    ),
    [services, search],
  );

  const metrics = useMemo(() => {
    const active = services.filter((s) => s.active);
    const avgPrice = active.length > 0
      ? Math.round(active.reduce((sum, s) => sum + s.price, 0) / active.length)
      : 0;
    const avgDur = active.length > 0
      ? Math.round(active.reduce((sum, s) => sum + s.durationMin, 0) / active.length)
      : 0;
    return { active: active.length, inactive: services.length - active.length, avgPrice, avgDur };
  }, [services]);

  const toggleActive = async (s: ServiceRow) => {
    await apiCall(`/api/services/${s.id}`, "PATCH", { active: !s.active });
    refetch();
  };

  const openEdit = (s: ServiceRow) => { setSelected(s); setModal("edit"); };
  const openDelete = (s: ServiceRow) => { setSelected(s); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelected(null); };
  const afterSave = () => { closeModal(); refetch(); };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-950">
      <Header title="Servicios" />

      {modal === "create" && <ServiceModal onClose={closeModal} onSaved={afterSave} />}
      {modal === "edit" && selected && <ServiceModal service={selected} onClose={closeModal} onSaved={afterSave} />}
      {modal === "delete" && selected && <DeleteConfirm service={selected} onClose={closeModal} onDeleted={afterSave} />}

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-7 py-6">
        {/* Metrics */}
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Activos", value: metrics.active, icon: Layers, color: "text-emerald-400" },
            { label: "Pausados", value: metrics.inactive, icon: Power, color: "text-zinc-500" },
            { label: "Precio promedio", value: formatCOP(metrics.avgPrice), icon: TrendingUp, color: "text-gold-light" },
            { label: "Duracion prom.", value: `${metrics.avgDur} min`, icon: Clock, color: "text-blue-400" },
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

        {/* Table section */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.05] bg-[#111113]">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] px-5 py-4">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar servicio o categoria..."
                className="w-72 rounded-lg border border-white/[0.06] bg-zinc-800/60 py-2 pl-8 pr-3 text-[12.5px] text-zinc-200 outline-none transition focus:border-gold-b placeholder:text-zinc-600"
              />
            </div>
            <button
              type="button"
              onClick={() => setModal("create")}
              className="flex items-center gap-2 rounded-xl border border-gold-b bg-gold-subtle px-4 py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)]"
            >
              <Plus size={14} />
              Nuevo servicio
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1.4fr_130px_110px_140px_130px_80px] gap-3 border-b border-white/[0.04] px-5 py-3">
            {["Servicio", "Categoria", "Duracion", "Precio", "Estado", ""].map((label) => (
              <div key={label} className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{label}</div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse border-b border-white/[0.03] bg-zinc-800/20" />
            ))
          ) : filtered.length > 0 ? (
            filtered.map((service) => (
              <div
                key={service.id}
                className="group grid grid-cols-[1.4fr_130px_110px_140px_130px_80px] items-center gap-3 border-b border-white/[0.03] px-5 py-4 transition hover:bg-zinc-800/20"
              >
                <div>
                  <div className="text-sm font-medium text-zinc-100">{service.name}</div>
                  <div className="mt-0.5 line-clamp-1 text-xs text-zinc-600">
                    {service.description || "Sin descripcion"}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Tag size={11} className="text-zinc-600" />
                  {service.category?.name ?? "General"}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                  <Clock size={11} className="text-zinc-600" />
                  {service.durationMin} min
                </div>
                <div className="text-sm font-semibold text-gold-light">
                  {formatCOP(service.price)}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => toggleActive(service)}
                    className="flex items-center gap-1.5 transition"
                    title={service.active ? "Pausar" : "Activar"}
                  >
                    {service.active ? (
                      <>
                        <ToggleRight size={18} className="text-emerald-400" />
                        <span className="text-[11px] font-medium text-emerald-400">Activo</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={18} className="text-zinc-600" />
                        <span className="text-[11px] font-medium text-zinc-500">Pausado</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEdit(service)}
                    title="Editar"
                    className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openDelete(service)}
                    title="Desactivar"
                    className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-400/10 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.06] bg-zinc-800/60">
                <Layers size={22} className="text-zinc-500" />
              </div>
              <h3 className="text-base font-semibold text-zinc-200">
                {search ? "Sin resultados" : "Tu catalogo esta vacio"}
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                {search
                  ? "No hay servicios que coincidan con la busqueda."
                  : "Crea el primer servicio para habilitar reservas en la vitrina publica."}
              </p>
              {!search && (
                <button
                  type="button"
                  onClick={() => setModal("create")}
                  className="mt-5 mx-auto flex items-center gap-2 rounded-xl border border-gold-b bg-gold-subtle px-4 py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)]"
                >
                  <Plus size={14} />
                  Crear primer servicio
                </button>
              )}
            </div>
          )}

          {/* Footer count */}
          {filtered.length > 0 && (
            <div className="border-t border-white/[0.04] bg-zinc-800/20 px-5 py-3">
              <span className="text-[11.5px] text-zinc-600">{filtered.length} servicios</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import Header from "@/src/components/admin/dashboard/Header";
import { apiCall, useApi, useApiPaginated } from "@/src/hooks/useApi";
import { formatCOP, getInitials } from "@/src/types";
import type { Client } from "@/src/types";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Phone,
  Mail,
  Calendar,
  Star,
  Users,
  TrendingUp,
  UserPlus,
  UserMinus,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CalendarCheck,
  BarChart3,
  Scissors,
  History,
} from "lucide-react";

const PAGE_SIZE = 50;

interface ClientWithCount extends Client {
  _count?: { appointments: number };
}

interface ClientHistoryEntry {
  id: string;
  startsAt: string;
  total: number;
  service: { id: string; name: string } | null;
}

interface ClientDetail extends ClientWithCount {
  totalSpent: number;
  appointments: ClientHistoryEntry[];
}

const TAG_CONFIG = {
  vip: { label: "VIP", color: "text-amber-300", bg: "bg-amber-400/10", border: "border-amber-400/25" },
  frecuente: { label: "Frecuente", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/25" },
  nuevo: { label: "Nuevo", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25" },
  inactivo: { label: "Inactivo", color: "text-zinc-500", bg: "bg-zinc-700/40", border: "border-white/[0.06]" },
} as const;

function getClientTag(c: ClientWithCount): keyof typeof TAG_CONFIG {
  if (c.totalVisits >= 15) return "vip";
  if (c.totalVisits >= 5) return "frecuente";
  const last = c.lastVisitAt ? new Date(c.lastVisitAt) : null;
  if (last && Date.now() - last.getTime() > 30 * 86400000) return "inactivo";
  return "nuevo";
}

const FIELD_CLASS =
  "w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-gold-border placeholder:text-zinc-600";
const LABEL_CLASS =
  "mb-1.5 block text-[10.5px] uppercase tracking-[0.12em] text-zinc-500";

type ClientFormData = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

function ClientModal({
  client,
  onClose,
  onSaved,
}: {
  client?: ClientWithCount;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!client;
  const [form, setForm] = useState<ClientFormData>({
    name: client?.name ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    notes: client?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof ClientFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Nombre y telefono son obligatorios");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    const { error: apiError } = isEdit
      ? await apiCall(`/api/clients/${client.id}`, "PATCH", payload)
      : await apiCall("/api/clients", "POST", payload);

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
              {isEdit ? "Editar cliente" : "Nuevo cliente"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {isEdit ? "Actualiza los datos del perfil." : "Registra un nuevo cliente en la base de datos."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>Nombre completo</label>
            <input value={form.name} onChange={set("name")} placeholder="Juan Perez" className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Telefono</label>
            <input value={form.phone} onChange={set("phone")} placeholder="+57 300 000 0000" className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Email (opcional)</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="cliente@email.com" className={FIELD_CLASS} />
          </div>
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>Notas internas</label>
            <textarea rows={3} value={form.notes} onChange={set("notes")} placeholder="Preferencias, alergias u observaciones del barbero." className={FIELD_CLASS} />
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
            className="flex-1 rounded-xl border border-gold-border bg-gold-subtle px-4 py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] disabled:opacity-40"
          >
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({
  client,
  onClose,
  onDeleted,
}: {
  client: ClientWithCount;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    const { error: err } = await apiCall(`/api/clients/${client.id}`, "DELETE");
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
        <h3 className="text-base font-semibold text-zinc-100">Desactivar cliente</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Se ocultara el perfil de <span className="font-medium text-zinc-300">{client.name}</span>. El historial de citas se conserva.
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

function SectionHeader({ icon: Icon, label }: { icon: typeof BarChart3; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-5 pb-2 pt-4">
      <Icon size={12} className="text-zinc-600" />
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</span>
    </div>
  );
}

function ClientDetailPanel({
  client,
  onClose,
  onEdit,
  onDelete,
}: {
  client: ClientWithCount;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // El listado no trae historial de citas ni el gasto total — se piden aquí
  // al abrir el modal. Mientras carga, se muestra la fila de la tabla como
  // adelanto (nombre, telefono, visitas ya se conocen).
  const { data: detail, loading } = useApi<ClientDetail>(`/api/clients/${client.id}`);
  const full = detail ?? client;

  const tag = TAG_CONFIG[getClientTag(full)];
  const lastVisit = full.lastVisitAt
    ? new Date(full.lastVisitAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
    : "Sin visitas";
  const clientSince = new Date(full.createdAt).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const preferences = full.notes
    ? full.notes.split("\n").map((line) => line.trim()).filter(Boolean)
    : [];
  const history = detail?.appointments ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#111113] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.04] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-gold-border bg-[#2A2116] text-[14px] font-semibold text-gold-light">
              {getInitials(full.name)}
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-zinc-100">{full.name}</h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-zinc-400">
                <Phone size={11} className="text-zinc-600" />
                {full.phone}
              </div>
              <span className={`mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tag.color} ${tag.bg} ${tag.border}`}>
                {tag.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onEdit} title="Editar" className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200">
              <Pencil size={13} />
            </button>
            <button type="button" onClick={onDelete} title="Eliminar" className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-400/10 hover:text-red-400">
              <Trash2 size={13} />
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200">
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto">
          <div className="px-5 pt-4 text-[11.5px] text-zinc-500">
            Cliente desde <span className="text-zinc-300 capitalize">{clientSince}</span>
          </div>

          {/* Resumen */}
          <SectionHeader icon={BarChart3} label="Resumen" />
          <div className="grid grid-cols-3 border-b border-white/[0.04] px-5 pb-4">
            {[
              { label: "Visitas", value: full.totalVisits },
              { label: "Total gastado", value: loading ? "…" : formatCOP(detail?.totalSpent ?? 0) },
              { label: "Última visita", value: lastVisit },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-[15px] font-semibold text-zinc-100">{value}</div>
                <div className="mt-0.5 text-[10px] text-zinc-600">{label}</div>
              </div>
            ))}
          </div>

          {/* Contacto adicional */}
          {(full.email || full.birthDate) && (
            <div className="flex flex-col gap-2 border-b border-white/[0.04] px-5 py-3.5">
              {full.email && (
                <div className="flex items-center gap-2 text-[12px] text-zinc-400">
                  <Mail size={11} className="flex-shrink-0 text-zinc-600" />
                  {full.email}
                </div>
              )}
              {full.birthDate && (
                <div className="flex items-center gap-2 text-[12px] text-zinc-500">
                  <Calendar size={11} className="flex-shrink-0 text-zinc-600" />
                  {new Date(full.birthDate).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}
                </div>
              )}
            </div>
          )}

          {/* Preferencias */}
          {preferences.length > 0 && (
            <>
              <SectionHeader icon={Scissors} label="Preferencias" />
              <ul className="flex flex-col gap-1.5 border-b border-white/[0.04] px-5 pb-4">
                {preferences.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-zinc-400">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
                    {line}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Historial */}
          <SectionHeader icon={History} label="Historial" />
          <div className="pb-2">
            {loading ? (
              <div className="flex flex-col gap-2 px-5 pb-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-9 animate-pulse rounded-lg bg-zinc-800/40" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="px-5 pb-4 text-[12px] text-zinc-600">Sin citas completadas todavía.</p>
            ) : (
              history.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-2 text-[12.5px]">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <span className="w-14 flex-shrink-0 tabular-nums text-zinc-500">
                      {new Date(a.startsAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                    </span>
                    <span className="text-zinc-300">{a.service?.name ?? "Servicio"}</span>
                  </div>
                  <span className="tabular-nums text-zinc-400">{formatCOP(a.total)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-white/[0.04] p-4">
          <button
            type="button"
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gold-border bg-gold-subtle py-2 text-[12px] font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)]"
          >
            <CalendarCheck size={12} />
            Nueva cita
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"visits" | "name">("visits");
  const [selected, setSelected] = useState<ClientWithCount | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [page, setPage] = useState(1);

  const { data: clients, pagination, loading, refetch } = useApiPaginated<ClientWithCount>(
    `/api/clients?search=${encodeURIComponent(search)}&page=${page}&limit=${PAGE_SIZE}`,
  );

  // Volver a la página 1 cuando cambia la búsqueda — el total de resultados
  // cambia, así que la página en la que estábamos puede ya no existir.
  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(() =>
    clients
      .filter((c) => tagFilter === "all" || getClientTag(c) === tagFilter)
      .sort((a, b) => sortBy === "visits" ? b.totalVisits - a.totalVisits : a.name.localeCompare(b.name)),
    [clients, tagFilter, sortBy],
  );

  const vips = clients.filter((c) => getClientTag(c) === "vip").length;
  const nuevos = clients.filter((c) => getClientTag(c) === "nuevo").length;
  const inactivos = clients.filter((c) => getClientTag(c) === "inactivo").length;

  const closeModal = () => setModal(null);
  const afterSave = () => { closeModal(); setSelected(null); refetch(); };
  const afterDelete = () => { closeModal(); setSelected(null); refetch(); };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-950">
      <Header title="Clientes" />

      {modal === "create" && (
        <ClientModal onClose={closeModal} onSaved={afterSave} />
      )}
      {modal === "edit" && selected && (
        <ClientModal client={selected} onClose={closeModal} onSaved={afterSave} />
      )}
      {modal === "delete" && selected && (
        <DeleteConfirm client={selected} onClose={closeModal} onDeleted={afterDelete} />
      )}
      {modal === null && selected && (
        <ClientDetailPanel
          client={selected}
          onClose={() => setSelected(null)}
          onEdit={() => setModal("edit")}
          onDelete={() => setModal("delete")}
        />
      )}

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 py-5 sm:px-7 sm:py-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total clientes", value: pagination?.total ?? clients.length, icon: Users, color: "text-zinc-100" },
            { label: "VIP", value: vips, icon: Star, color: "text-amber-300" },
            { label: "Nuevos", value: nuevos, icon: UserPlus, color: "text-emerald-400" },
            { label: "Inactivos", value: inactivos, icon: UserMinus, color: "text-zinc-500" },
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

        {/* Content */}
        <div className="flex items-start gap-5">
          {/* Table */}
          <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/[0.04] bg-[#111113]">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] px-5 py-3.5">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nombre, telefono o email..."
                  className="w-72 rounded-lg border border-white/[0.06] bg-zinc-800/60 py-2 pl-8 pr-3 text-[12.5px] text-zinc-200 outline-none transition focus:border-gold-border placeholder:text-zinc-600"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1">
                  {(["all", "vip", "frecuente", "nuevo", "inactivo"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTagFilter(t)}
                      className={`rounded-lg px-3 py-1.5 text-[11.5px] capitalize transition-all border ${
                        tagFilter === t
                          ? "border-white/[0.12] bg-zinc-700 font-medium text-zinc-100"
                          : "border-transparent text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {t === "all" ? "Todos" : TAG_CONFIG[t as keyof typeof TAG_CONFIG]?.label}
                    </button>
                  ))}
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-lg border border-white/[0.06] bg-zinc-800/60 px-3 py-2 text-[12px] text-zinc-400 outline-none"
                >
                  <option value="visits">Ordenar: visitas</option>
                  <option value="name">Ordenar: nombre</option>
                </select>
              </div>
            </div>

            {pagination && pagination.pages > 1 && tagFilter !== "all" ? (
              <div className="border-b border-white/[0.04] bg-amber-400/5 px-5 py-2 text-[11px] text-amber-400/80">
                El filtro de etiqueta solo se aplica a la página actual — hay {pagination.pages} páginas de clientes.
              </div>
            ) : null}

            {/* Table header */}
            <div className="grid grid-cols-[1fr_150px_70px_90px_40px] gap-3 border-b border-white/[0.04] px-5 py-2.5">
              {["Cliente", "Telefono", "Visitas", "Estado", ""].map((h) => (
                <div key={h} className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">{h}</div>
              ))}
            </div>

            {/* Rows */}
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex gap-3 border-b border-white/[0.03] px-5 py-3.5">
                    {[180, 120, 60, 80].map((w, j) => (
                      <div key={j} className="h-4 animate-pulse rounded bg-zinc-800/60" style={{ width: w }} />
                    ))}
                  </div>
                ))
              : filtered.map((c) => {
                  const tag = TAG_CONFIG[getClientTag(c)];
                  const isSelected = selected?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelected(isSelected ? null : c)}
                      className={`grid cursor-pointer grid-cols-[1fr_150px_70px_90px_40px] items-center gap-3 border-b border-white/[0.03] px-5 py-3 transition-colors ${
                        isSelected ? "bg-gold-subtle" : "hover:bg-zinc-800/30"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-zinc-700 text-[10.5px] font-medium text-zinc-400">
                          {getInitials(c.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-zinc-100">{c.name}</div>
                          <div className="truncate text-[10.5px] text-zinc-600">{c.email ?? "—"}</div>
                        </div>
                      </div>
                      <div className="text-[12.5px] tabular-nums text-zinc-400">{c.phone}</div>
                      <div className="text-[13px] font-semibold tabular-nums text-zinc-200">{c.totalVisits}</div>
                      <div>
                        <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${tag.color} ${tag.bg} ${tag.border}`}>
                          {tag.label}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <ChevronRight size={13} className={`transition-colors ${isSelected ? "text-gold-light" : "text-zinc-700"}`} />
                      </div>
                    </div>
                  );
                })}

            {!loading && filtered.length === 0 && (
              <div className="py-14 text-center text-[13px] text-zinc-600">No se encontraron clientes</div>
            )}

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.04] bg-zinc-800/20 px-5 py-3">
              <span className="text-[11.5px] text-zinc-600">
                {filtered.length} de {pagination?.total ?? clients.length} clientes
              </span>

              <div className="flex items-center gap-3">
                {pagination && pagination.pages > 1 ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="flex items-center justify-center rounded-lg border border-white/[0.08] p-1.5 text-zinc-400 transition hover:border-white/[0.16] hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <span className="text-[11.5px] text-zinc-500">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page >= pagination.pages}
                      className="flex items-center justify-center rounded-lg border border-white/[0.08] p-1.5 text-zinc-400 transition hover:border-white/[0.16] hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setModal("create")}
                  className="flex items-center gap-1.5 rounded-lg border border-gold-border bg-gold-subtle px-3 py-1.5 text-[12px] font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.15)]"
                >
                  <Plus size={12} />
                  Nuevo cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

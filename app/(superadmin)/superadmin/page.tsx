"use client";

import { useEffect, useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { apiCall, useApi, useApiList } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import type { Plan } from "@/src/types";
import {
  Search,
  TrendingUp,
  Store,
  Users,
  CalendarCheck,
  Power,
  ChevronDown,
  ExternalLink,
  Circle,
  LogIn,
  Trash2,
  X,
  Send,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import Header from "@/src/components/admin/dashboard/Header";

const PLAN_CONFIG: Record<Plan, { label: string; color: string; bg: string; border: string; price: number }> = {
  basico: { label: "Basico", color: "text-zinc-400", bg: "bg-zinc-800/60", border: "border-white/[0.08]", price: 80000 },
  pro: { label: "Pro", color: "text-gold", bg: "bg-gold-subtle", border: "border-gold-border", price: 120000 },
  premium: { label: "Premium", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/25", price: 180000 },
};

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  active: boolean;
  email: string | null;
  city: string | null;
  createdAt: string;
  _count: { appointments: number; clients: number; barbers: number };
}

function PlanBadge({ plan }: { plan: Plan }) {
  const cfg = PLAN_CONFIG[plan];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function TenantActions({
  tenant,
  onUpdated,
  onDeleteRequested,
}: {
  tenant: TenantRow;
  onUpdated: () => void;
  onDeleteRequested: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [impersonateError, setImpersonateError] = useState("");

  const update = async (payload: Partial<Pick<TenantRow, "active" | "plan">>) => {
    setOpen(false);
    setLoading(true);
    await apiCall(`/api/superadmin/tenants/${tenant.id}`, "PATCH", payload);
    setLoading(false);
    onUpdated();
  };

  const impersonate = async () => {
    setImpersonateError("");
    setImpersonating(true);
    const { data, error } = await apiCall<{ token: string }>(
      `/api/superadmin/tenants/${tenant.id}/impersonate`,
      "POST",
    );
    if (error || !data) {
      setImpersonating(false);
      setImpersonateError(error ?? "No se pudo generar el acceso.");
      return;
    }
    await signIn("credentials", {
      impersonationToken: data.token,
      callbackUrl: "/dashboard",
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-1 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-[11.5px] text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-200 disabled:opacity-40"
      >
        {loading ? <Circle size={10} className="animate-spin" /> : "Acciones"}
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-white/[0.08] bg-[#18181C] shadow-2xl">
            <div className="border-b border-white/[0.06] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">Estado</p>
            </div>
            <button
              type="button"
              onClick={() => update({ active: !tenant.active })}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-[12.5px] text-zinc-300 transition hover:bg-white/[0.04]"
            >
              <Power size={12} className={tenant.active ? "text-red-400" : "text-emerald-400"} />
              {tenant.active ? "Desactivar tenant" : "Activar tenant"}
            </button>
            <div className="border-t border-white/[0.06] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">Cambiar plan</p>
            </div>
            {(["basico", "pro", "premium"] as Plan[])
              .filter((p) => p !== tenant.plan)
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => update({ plan: p })}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-[12.5px] text-zinc-300 transition hover:bg-white/[0.04]"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${PLAN_CONFIG[p].color.replace("text-", "bg-")}`} />
                  Pasar a {PLAN_CONFIG[p].label}
                </button>
              ))}
            <div className="border-t border-white/[0.06] px-1.5 py-1.5">
              <a
                href={`https://${tenant.slug}.${process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "vanttage.app"}/dashboard`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-[12.5px] text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-200"
              >
                <ExternalLink size={11} />
                Abrir dashboard
              </a>
              <button
                type="button"
                onClick={impersonate}
                disabled={impersonating}
                className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-[12.5px] text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-200 disabled:opacity-50"
              >
                <LogIn size={11} />
                {impersonating ? "Entrando..." : "Entrar como dueño"}
              </button>
              {impersonateError && (
                <p className="px-1.5 pb-1 text-[11px] text-red-400">{impersonateError}</p>
              )}
            </div>
            <div className="border-t border-white/[0.06] px-1.5 py-1.5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onDeleteRequested();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-[12.5px] text-red-400 transition hover:bg-red-400/10"
              >
                <Trash2 size={11} />
                Eliminar tenant
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Modal de confirmación para eliminar ────────────────────────────────────

function DeleteTenantModal({
  tenant,
  onClose,
  onDeleted,
}: {
  tenant: TenantRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    const { error: apiError } = await apiCall(
      `/api/superadmin/tenants/${tenant.id}`,
      "DELETE",
      { confirmSlug: confirmText },
    );
    setLoading(false);
    if (apiError) {
      setError(apiError);
      return;
    }
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-400/20 bg-[#18181C] p-6 shadow-2xl">
        <h3 className="text-[16px] font-semibold text-zinc-100">Eliminar barbería</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
          Esto borra <strong className="text-zinc-200">{tenant.name}</strong> y todo lo que
          tiene dentro — barberos, servicios, clientes, citas, caja. No se puede deshacer.
        </p>
        <p className="mt-4 text-[12.5px] text-zinc-500">
          Escribe <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">{tenant.slug}</code> para confirmar:
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={tenant.slug}
          className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 text-[13px] text-zinc-100 outline-none transition focus:border-red-400/60"
        />
        {error && (
          <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-[12.5px] text-red-300">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-[13px] text-zinc-300 transition hover:bg-white/[0.04]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={confirmText !== tenant.slug || loading}
            className="rounded-xl bg-red-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Eliminando..." : "Eliminar definitivamente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Drawer de detalle ───────────────────────────────────────────────────────

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  active: boolean;
  createdAt: string;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  telegramEnabled: boolean;
  automations: {
    autoConfirmacion: boolean;
    autoReminder24h: boolean;
    autoReminder1h: boolean;
    autoReviewRequest: boolean;
    autoReactivacion: boolean;
    autoWeeklyReport: boolean;
  };
  owner: { name: string; email: string; phone: string | null; lastLoginAt: string | null } | null;
  counts: { appointments: number; clients: number; barbers: number; services: number };
  lastAppointmentAt: string | null;
}

const AUTOMATION_LABELS: Record<keyof TenantDetail["automations"], string> = {
  autoConfirmacion: "Confirmación de cita",
  autoReminder24h: "Recordatorio 24h",
  autoReminder1h: "Recordatorio 1h",
  autoReviewRequest: "Solicitud de reseña",
  autoReactivacion: "Reactivación de clientes",
  autoWeeklyReport: "Reporte semanal",
};

function formatDate(value: string | null) {
  if (!value) return "Nunca";
  return new Date(value).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TenantDetailDrawer({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const { data: tenant, loading } = useApi<TenantDetail>(`/api/superadmin/tenants/${tenantId}`);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-white/[0.08] bg-[#0E0E12] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
        >
          <X size={18} />
        </button>

        {loading || !tenant ? (
          <div className="space-y-4 pt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-zinc-800/50" />
            ))}
          </div>
        ) : (
          <>
            <div className="pr-8">
              <h2 className="font-display text-[22px] font-semibold text-zinc-100">{tenant.name}</h2>
              <p className="mt-0.5 text-[12.5px] text-zinc-500">{tenant.slug}.vanttage.app</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <PlanBadge plan={tenant.plan} />
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${
                    tenant.active
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                      : "border-white/[0.06] bg-zinc-800/60 text-zinc-600"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${tenant.active ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  {tenant.active ? "Activa" : "Inactiva"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${
                    tenant.telegramEnabled
                      ? "border-[#229ED9]/25 bg-[#229ED9]/10 text-[#5fc4ec]"
                      : "border-white/[0.06] bg-zinc-800/60 text-zinc-600"
                  }`}
                >
                  <Send size={10} />
                  Telegram {tenant.telegramEnabled ? "activo" : "apagado"}
                </span>
              </div>
            </div>

            {/* Dueño */}
            <section className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Dueño</h3>
              {tenant.owner ? (
                <div className="space-y-1.5 text-[13px]">
                  <p className="font-medium text-zinc-200">{tenant.owner.name}</p>
                  <p className="text-zinc-400">{tenant.owner.email}</p>
                  {tenant.owner.phone && <p className="text-zinc-400">{tenant.owner.phone}</p>}
                  <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-zinc-600">
                    <Clock size={11} />
                    Último ingreso: {formatDate(tenant.owner.lastLoginAt)}
                  </p>
                </div>
              ) : (
                <p className="text-[13px] text-zinc-500">Sin usuario dueño registrado.</p>
              )}
            </section>

            {/* Contacto / ubicación */}
            {(tenant.phone || tenant.whatsapp || tenant.address || tenant.city) && (
              <section className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Contacto
                </h3>
                <div className="space-y-2 text-[13px] text-zinc-400">
                  {tenant.phone && (
                    <p className="flex items-center gap-2"><Phone size={12} className="text-zinc-600" /> {tenant.phone}</p>
                  )}
                  {tenant.whatsapp && (
                    <p className="flex items-center gap-2"><Phone size={12} className="text-zinc-600" /> {tenant.whatsapp} (WhatsApp)</p>
                  )}
                  {(tenant.address || tenant.city) && (
                    <p className="flex items-center gap-2">
                      <MapPin size={12} className="text-zinc-600" />
                      {[tenant.address, tenant.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Actividad */}
            <section className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Actividad</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                {[
                  { label: "Barberos", value: tenant.counts.barbers },
                  { label: "Servicios", value: tenant.counts.services },
                  { label: "Clientes", value: tenant.counts.clients },
                  { label: "Citas", value: tenant.counts.appointments },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-black/30 py-2.5">
                    <div className="text-[16px] font-semibold text-zinc-100">{value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-zinc-600">
                Última cita creada: {formatDate(tenant.lastAppointmentAt)}
              </p>
              <p className="text-[11.5px] text-zinc-600">
                Cliente desde: {formatDate(tenant.createdAt)}
              </p>
            </section>

            {/* Automatizaciones */}
            <section className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Automatizaciones
              </h3>
              <div className="space-y-2">
                {(Object.keys(AUTOMATION_LABELS) as (keyof TenantDetail["automations"])[]).map((key) => (
                  <div key={key} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-zinc-400">{AUTOMATION_LABELS[key]}</span>
                    <span className={tenant.automations[key] ? "text-emerald-400" : "text-zinc-600"}>
                      {tenant.automations[key] ? "Activa" : "Pausada"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<TenantRow | null>(null);
  const [detailTenantId, setDetailTenantId] = useState<string | null>(null);

  const { data: tenants, loading, refetch } = useApiList<TenantRow>("/api/superadmin/tenants");

  const filtered = useMemo(() =>
    tenants
      .filter((t) => planFilter === "all" || t.plan === planFilter)
      .filter((t) => statusFilter === "all" || (statusFilter === "active" ? t.active : !t.active))
      .filter(
        (t) =>
          !search ||
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.slug.toLowerCase().includes(search.toLowerCase()) ||
          t.email?.toLowerCase().includes(search.toLowerCase()),
      ),
    [tenants, planFilter, statusFilter, search],
  );

  const mrr = useMemo(
    () => tenants.filter((t) => t.active).reduce((s, t) => s + PLAN_CONFIG[t.plan].price, 0),
    [tenants],
  );
  const activeTenants = tenants.filter((t) => t.active).length;
  const totalAppts = tenants.reduce((s, t) => s + t._count.appointments, 0);
  const totalClients = tenants.reduce((s, t) => s + t._count.clients, 0);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header title="Panel Global" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Ingreso potencial", value: formatCOP(mrr), icon: TrendingUp, color: "text-gold-light", accent: true },
            { label: "Barberias activas", value: activeTenants, icon: Store, color: "text-emerald-400", accent: false },
            { label: "Total clientes", value: totalClients, icon: Users, color: "text-blue-400", accent: false },
            { label: "Total citas", value: totalAppts, icon: CalendarCheck, color: "text-zinc-300", accent: false },
          ].map(({ label, value, icon: Icon, color, accent }) => (
            <div
              key={label}
              className={`flex items-center gap-4 rounded-xl border p-5 ${
                accent
                  ? "border-gold-border bg-gradient-to-br from-[rgba(201,168,76,0.12)] to-[rgba(201,168,76,0.03)]"
                  : "border-white/[0.04] bg-[#111113]"
              }`}
            >
              <div className={`rounded-lg border border-white/[0.05] bg-zinc-800/60 p-2.5 ${accent ? "border-gold-border/40 bg-gold-subtle" : ""}`}>
                <Icon size={16} className={color} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
                <div className={`text-xl font-semibold ${color}`}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/[0.04] bg-[#111113]">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] px-5 py-4">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar barberia, slug o email..."
                className="w-72 rounded-lg border border-white/[0.06] bg-zinc-800/60 py-2 pl-8 pr-3 text-[12.5px] text-zinc-200 outline-none transition focus:border-gold-border placeholder:text-zinc-600"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Plan filter */}
              <div className="flex gap-1">
                {["all", "basico", "pro", "premium"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlanFilter(p)}
                    className={`rounded-lg border px-3 py-1.5 text-[11.5px] capitalize transition-all ${
                      planFilter === p
                        ? "border-white/[0.12] bg-zinc-700 font-medium text-zinc-100"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {p === "all" ? "Todos" : PLAN_CONFIG[p as Plan]?.label}
                  </button>
                ))}
              </div>
              {/* Status filter */}
              <div className="flex gap-1">
                {[
                  { v: "all", l: "Todos" },
                  { v: "active", l: "Activas" },
                  { v: "inactive", l: "Inactivas" },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => setStatusFilter(v)}
                    className={`rounded-lg border px-3 py-1.5 text-[11.5px] transition-all ${
                      statusFilter === v
                        ? "border-white/[0.12] bg-zinc-700 font-medium text-zinc-100"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table head */}
          <div className="grid grid-cols-[1fr_110px_70px_80px_100px_100px_80px_100px] gap-3 border-b border-white/[0.04] px-5 py-3">
            {["Barberia", "Plan", "Barberos", "Clientes", "Citas", "Ingreso potencial", "Estado", ""].map((h) => (
              <div key={h} className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">{h}</div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 border-b border-white/[0.03] px-5 py-4">
                {[200, 80, 60, 60, 70, 80, 60, 80].map((w, j) => (
                  <div key={j} className="h-4 animate-pulse rounded bg-zinc-800/60" style={{ width: w }} />
                ))}
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((t) => {
              const plan = PLAN_CONFIG[t.plan];
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-[1fr_110px_70px_80px_100px_100px_80px_100px] items-center gap-3 border-b border-white/[0.03] px-5 py-4 transition hover:bg-zinc-800/20"
                >
                  {/* Name */}
                  <button
                    type="button"
                    onClick={() => setDetailTenantId(t.id)}
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gold-border bg-[#2A2116] text-[10px] font-bold text-gold-light">
                      {t.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-zinc-100 hover:underline">{t.name}</div>
                      <div className="text-[10.5px] text-zinc-600">{t.slug}.vanttage.app</div>
                    </div>
                  </button>
                  <div><PlanBadge plan={t.plan} /></div>
                  <div className="tabular-nums text-[13px] font-medium text-zinc-300">{t._count.barbers}</div>
                  <div className="tabular-nums text-[13px] font-medium text-zinc-300">{t._count.clients}</div>
                  <div className="tabular-nums text-[13px] font-medium text-zinc-300">{t._count.appointments}</div>
                  <div className="tabular-nums text-[12.5px] font-medium text-gold-light">{formatCOP(plan.price)}/mes</div>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${
                        t.active
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                          : "border-white/[0.06] bg-zinc-800/60 text-zinc-600"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${t.active ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      {t.active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <TenantActions
                      tenant={t}
                      onUpdated={refetch}
                      onDeleteRequested={() => setDeleteTarget(t)}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center">
              <Store size={28} className="mx-auto mb-3 text-zinc-700" />
              <p className="text-[13px] text-zinc-600">
                {search || planFilter !== "all" || statusFilter !== "all"
                  ? "Sin barberias que coincidan con los filtros"
                  : "Sin barberias registradas aun"}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/[0.04] bg-zinc-800/20 px-5 py-3">
            <span className="text-[11.5px] text-zinc-600">
              {filtered.length} de {tenants.length} barberias
            </span>
            <span className="text-[12px] font-medium text-gold-light">
              Ingreso potencial: {formatCOP(mrr)}
            </span>
          </div>
        </div>

        {/* Plan distribution */}
        {tenants.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            {(["basico", "pro", "premium"] as Plan[]).map((p) => {
              const cfg = PLAN_CONFIG[p];
              const count = tenants.filter((t) => t.plan === p && t.active).length;
              const revenue = count * cfg.price;
              return (
                <div key={p} className="rounded-xl border border-white/[0.04] bg-[#111113] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <PlanBadge plan={p} />
                    <span className="text-[11px] text-zinc-600">{count} activos</span>
                  </div>
                  <div className={`text-[20px] font-semibold ${cfg.color}`}>{formatCOP(revenue)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-600 mt-0.5">Ingreso potencial por plan</div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {deleteTarget && (
        <DeleteTenantModal
          tenant={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            refetch();
          }}
        />
      )}

      {detailTenantId && (
        <TenantDetailDrawer tenantId={detailTenantId} onClose={() => setDetailTenantId(null)} />
      )}
    </div>
  );
}

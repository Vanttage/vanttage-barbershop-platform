"use client";

import { useState, useMemo } from "react";
import { apiCall, useApiList } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import type { Plan } from "@/src/types";
import {
  Search,
  Shield,
  TrendingUp,
  Store,
  Users,
  CalendarCheck,
  Power,
  ChevronDown,
  ExternalLink,
  Circle,
} from "lucide-react";
import Header from "@/src/components/admin/dashboard/Header";

const PLAN_CONFIG: Record<Plan, { label: string; color: string; bg: string; border: string; price: number }> = {
  basico: { label: "Basico", color: "text-zinc-400", bg: "bg-zinc-800/60", border: "border-white/[0.08]", price: 80000 },
  pro: { label: "Pro", color: "text-gold", bg: "bg-gold-subtle", border: "border-gold-b", price: 120000 },
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

function TenantActions({ tenant, onUpdated }: { tenant: TenantRow; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = async (payload: Partial<Pick<TenantRow, "active" | "plan">>) => {
    setOpen(false);
    setLoading(true);
    await apiCall(`/api/superadmin/tenants/${tenant.id}`, "PATCH", payload);
    setLoading(false);
    onUpdated();
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
            <div className="border-t border-white/[0.06] px-3 py-2">
              <a
                href={`https://${tenant.slug}.${process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "vanttage.app"}/dashboard`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2 text-[12.5px] text-zinc-400 transition hover:text-zinc-200 py-1"
              >
                <ExternalLink size={11} />
                Abrir dashboard
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SuperAdminPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
            { label: "MRR", value: formatCOP(mrr), icon: TrendingUp, color: "text-gold-light", accent: true },
            { label: "Barberias activas", value: activeTenants, icon: Store, color: "text-emerald-400", accent: false },
            { label: "Total clientes", value: totalClients, icon: Users, color: "text-blue-400", accent: false },
            { label: "Total citas", value: totalAppts, icon: CalendarCheck, color: "text-zinc-300", accent: false },
          ].map(({ label, value, icon: Icon, color, accent }) => (
            <div
              key={label}
              className={`flex items-center gap-4 rounded-xl border p-5 ${
                accent
                  ? "border-gold-b bg-gradient-to-br from-[rgba(201,168,76,0.12)] to-[rgba(201,168,76,0.03)]"
                  : "border-white/[0.04] bg-[#111113]"
              }`}
            >
              <div className={`rounded-lg border border-white/[0.05] bg-zinc-800/60 p-2.5 ${accent ? "border-gold-b/40 bg-gold-subtle" : ""}`}>
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
                className="w-72 rounded-lg border border-white/[0.06] bg-zinc-800/60 py-2 pl-8 pr-3 text-[12.5px] text-zinc-200 outline-none transition focus:border-gold-b placeholder:text-zinc-600"
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
            {["Barberia", "Plan", "Barberos", "Clientes", "Citas", "MRR", "Estado", ""].map((h) => (
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
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gold-b bg-[#2A2116] text-[10px] font-bold text-gold-light">
                      {t.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-zinc-100">{t.name}</div>
                      <div className="text-[10.5px] text-zinc-600">{t.slug}.vanttage.app</div>
                    </div>
                  </div>
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
                    <TenantActions tenant={t} onUpdated={refetch} />
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
              MRR: {formatCOP(mrr)}
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
                  <div className="text-[10px] uppercase tracking-wider text-zinc-600 mt-0.5">MRR por plan</div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

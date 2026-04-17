"use client";

import { useState } from "react";
import { Mail, MessageCircle, Clock, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import Header from "@/src/components/admin/dashboard/Header";
import { useApi, apiCall } from "@/src/hooks/useApi";
import type { Plan } from "@/src/types";
import type { AutomationKey } from "@/src/lib/automations";

// ── Static automation catalog ──────────────────────────────────────────────────

interface AutomationMeta {
  key: AutomationKey;
  name: string;
  description: string;
  trigger: string;
  channel: "whatsapp" | "email";
  minPlan: Plan;
}

const AUTOMATIONS: AutomationMeta[] = [
  {
    key: "autoConfirmacion",
    name: "Confirmación de cita",
    description: "Mensaje automático al confirmar una reserva con todos los detalles.",
    trigger: "Al crear la cita",
    channel: "whatsapp",
    minPlan: "basico",
  },
  {
    key: "autoReminder24h",
    name: "Recordatorio 24 horas",
    description: "¡Mañana tienes cita! con opción de confirmar o cancelar respondiendo.",
    trigger: "24h antes de la cita",
    channel: "whatsapp",
    minPlan: "basico",
  },
  {
    key: "autoReminder1h",
    name: "Recordatorio 1 hora",
    description: "Aviso final con la dirección de la barbería incluida.",
    trigger: "1h antes de la cita",
    channel: "whatsapp",
    minPlan: "basico",
  },
  {
    key: "autoReviewRequest",
    name: "Solicitud de reseña",
    description: "Pide una reseña en Google Maps 2h después del servicio.",
    trigger: "2h tras completar la cita",
    channel: "whatsapp",
    minPlan: "pro",
  },
  {
    key: "autoReactivacion",
    name: "Reactivación de clientes",
    description: "¡Te echamos de menos! con descuento para clientes sin cita en 30 días.",
    trigger: "Cada lunes · clientes inactivos +30 días",
    channel: "whatsapp",
    minPlan: "pro",
  },
  {
    key: "autoWeeklyReport",
    name: "Reporte semanal al dueño",
    description: "Resumen de citas, ingresos y cliente más frecuente cada lunes 8am.",
    trigger: "Lunes 8:00 am",
    channel: "email",
    minPlan: "pro",
  },
];

// ── Plan gate ────────────────────────────────────────────────────────────────

const PLAN_ORDER: Plan[] = ["basico", "pro", "premium"];
function planAllows(tenantPlan: Plan, required: Plan) {
  return PLAN_ORDER.indexOf(tenantPlan) >= PLAN_ORDER.indexOf(required);
}

// ── Channel badge ─────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: "whatsapp" | "email" }) {
  if (channel === "whatsapp") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10.5px] font-medium text-emerald-400">
        <MessageCircle size={10} />
        WhatsApp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[10.5px] font-medium text-blue-400">
      <Mail size={10} />
      Email
    </span>
  );
}

// ── Plan badge ─────────────────────────────────────────────────────────────────

const PLAN_CLASSES: Record<Plan, string> = {
  basico:  "text-zinc-400 bg-zinc-800/60 border-white/[0.06]",
  pro:     "text-gold bg-gold-subtle border-gold/20",
  premium: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({
  active,
  disabled,
  onChange,
}: {
  active: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={active}
      className={[
        "relative flex-shrink-0 rounded-full border transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active ? "border-gold/40 bg-gold" : "border-white/[0.08] bg-zinc-700",
      ].join(" ")}
      style={{ width: 40, height: 22 }}
    >
      <span
        className="absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: active ? 20 : 3 }}
      />
    </button>
  );
}

// ── Automation card ────────────────────────────────────────────────────────────

function AutoCard({
  meta,
  enabled,
  locked,
  saving,
  onToggle,
}: {
  meta: AutomationMeta;
  enabled: boolean;
  locked: boolean;
  saving: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={[
        "rounded-xl border bg-[#111113] p-5 transition-all duration-200",
        locked
          ? "border-white/[0.03] opacity-60"
          : enabled
            ? "border-white/[0.06]"
            : "border-white/[0.03] opacity-75",
      ].join(" ")}
    >
      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-display text-[13.5px] font-semibold text-zinc-100">
              {meta.name}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${PLAN_CLASSES[meta.minPlan]}`}>
              {meta.minPlan}
            </span>
          </div>
          <p className="text-[12.5px] leading-snug text-zinc-500">
            {meta.description}
          </p>
        </div>
        <Toggle
          active={enabled}
          disabled={locked || saving}
          onChange={onToggle}
        />
      </div>

      {/* Trigger + channel */}
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.04] py-3">
        <div className="flex items-center gap-1.5 text-[11.5px] text-zinc-500">
          <Clock size={11} className="text-zinc-600" />
          {meta.trigger}
        </div>
        <span className="text-zinc-800">·</span>
        <ChannelBadge channel={meta.channel} />
      </div>

      {/* Status */}
      <div className="mt-3 flex items-center gap-1.5">
        {locked ? (
          <span className="text-[11.5px] text-zinc-600">Requiere plan Pro o Premium</span>
        ) : (
          <>
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${enabled ? "bg-emerald-400" : "bg-zinc-600"}`} />
            <span className="text-[11.5px] text-zinc-500">
              {saving ? "Guardando..." : enabled ? "Activa" : "Pausada"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── API response shape ─────────────────────────────────────────────────────────

interface AutomationConfig {
  plan: Plan;
  autoConfirmacion: boolean;
  autoReminder24h: boolean;
  autoReminder1h: boolean;
  autoReviewRequest: boolean;
  autoReactivacion: boolean;
  autoWeeklyReport: boolean;
  [key: string]: boolean | Plan;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AutomatizacionesPage() {
  const { data: config, loading, refetch } = useApi<AutomationConfig>("/api/automations");
  const [savingKey, setSavingKey] = useState<AutomationKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (key: AutomationKey, currentValue: boolean) => {
    setSavingKey(key);
    setError(null);
    const { error: apiError } = await apiCall("/api/automations", "PATCH", {
      key,
      enabled: !currentValue,
    });
    if (apiError) {
      setError(apiError);
    }
    await refetch();
    setSavingKey(null);
  };

  const activeCount  = config ? AUTOMATIONS.filter((a) => config[a.key]).length : 0;
  const pausedCount  = config ? AUTOMATIONS.filter((a) => !config[a.key] && planAllows(config.plan, a.minPlan)).length : 0;
  const lockedCount  = config ? AUTOMATIONS.filter((a) => !planAllows(config.plan, a.minPlan)).length : 0;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-950">
      <Header title="Automatizaciones" />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 py-6 sm:px-7">

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Flujos activos",  value: loading ? "—" : activeCount,  color: "text-emerald-400" },
            { label: "Flujos pausados", value: loading ? "—" : pausedCount,  color: "text-zinc-500"    },
            { label: "Bloqueados",      value: loading ? "—" : lockedCount,  color: "text-zinc-600"    },
            { label: "Plan actual",     value: loading ? "—" : (config?.plan ?? "—"), color: "text-gold-light" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/[0.04] bg-[#111113] px-4 py-3.5">
              <div className="mb-1 text-[10.5px] uppercase tracking-wider text-zinc-600">{label}</div>
              <div className={`text-[22px] font-medium capitalize ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="flex items-center gap-3 rounded-xl border border-gold/20 bg-gold-subtle px-5 py-3.5">
          <AlertCircle size={16} className="flex-shrink-0 text-gold" />
          <p className="text-[12.5px] text-gold-light">
            Las automatizaciones se ejecutan automáticamente vía{" "}
            <strong className="font-medium">Meta Cloud API</strong> (WhatsApp) y{" "}
            <strong className="font-medium">Resend</strong> (Email). Gratis hasta 1 000 conversaciones/mes en WhatsApp.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-[13px] text-red-300">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl border border-white/[0.04] bg-zinc-800/30" />
            ))}
          </div>
        ) : config ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {AUTOMATIONS.map((meta) => {
              const locked = !planAllows(config.plan, meta.minPlan);
              return (
                <AutoCard
                  key={meta.key}
                  meta={meta}
                  enabled={config[meta.key]}
                  locked={locked}
                  saving={savingKey === meta.key}
                  onToggle={() => handleToggle(meta.key, config[meta.key])}
                />
              );
            })}
          </div>
        ) : null}

        {/* Cron info */}
        <div className="rounded-xl border border-white/[0.04] bg-[#111113] p-5">
          <div className="mb-3 flex items-center gap-2">
            <RefreshCw size={14} className="text-zinc-500" />
            <h3 className="font-display text-[13.5px] font-semibold text-zinc-200">Cron jobs activos</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { label: "Recordatorios",     schedule: "Cada hora",         endpoint: "/api/cron/reminders" },
              { label: "Reactivación",      schedule: "Lunes 10:00 am",    endpoint: "/api/cron/reactivation" },
              { label: "Reporte semanal",   schedule: "Lunes 8:00 am",     endpoint: "/api/cron/weekly-report" },
            ].map(({ label, schedule, endpoint }) => (
              <div key={label} className="rounded-lg border border-white/[0.04] bg-zinc-900/60 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-medium text-zinc-200">{label}</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <CheckCircle2 size={10} />
                    Live
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-zinc-600">{schedule}</div>
                <div className="mt-0.5 truncate font-mono text-[9.5px] text-zinc-700">{endpoint}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

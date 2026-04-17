"use client";

import { useMemo, useState } from "react";
import Header from "@/src/components/admin/dashboard/Header";
import { apiCall, useApiList } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import type { AppointmentWithRelations, Payment } from "@/src/types";
import {
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRightLeft,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  X,
  Plus,
  Filter,
} from "lucide-react";

type PaymentRow = Payment & {
  client: { id: string; name: string; phone: string; email: string | null };
  appointment: {
    id: string;
    startsAt: string;
    status: string;
    total: number;
    service: { id: string; name: string };
    barber: { id: string; name: string };
  };
};

const METHOD_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  cash: { label: "Efectivo", icon: <Banknote size={13} />, color: "text-emerald-400" },
  transfer: { label: "Transferencia", icon: <ArrowRightLeft size={13} />, color: "text-blue-400" },
  card: { label: "Tarjeta", icon: <CreditCard size={13} />, color: "text-purple-400" },
  nequi: { label: "Nequi", icon: <Smartphone size={13} />, color: "text-pink-400" },
  daviplata: { label: "Daviplata", icon: <Smartphone size={13} />, color: "text-red-400" },
};

const STATUS_CONFIG_PAY: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  paid: { label: "Pagado", icon: <CheckCircle size={12} />, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25" },
  pending: { label: "Pendiente", icon: <Clock size={12} />, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/25" },
  failed: { label: "Fallido", icon: <XCircle size={12} />, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/25" },
  refunded: { label: "Reembolsado", icon: <RotateCcw size={12} />, color: "text-zinc-400", bg: "bg-zinc-700/40", border: "border-white/[0.07]" },
};

const FIELD_CLASS = "w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-gold-b";
const LABEL_CLASS = "mb-1.5 block text-[10.5px] uppercase tracking-[0.12em] text-zinc-500";

function RegisterPaymentModal({
  appointments,
  onClose,
  onCreated,
}: {
  appointments: AppointmentWithRelations[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    appointmentId: "",
    method: "cash",
    amount: "",
    status: "paid",
    reference: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedAppt = appointments.find((a) => a.id === form.appointmentId);

  const handleSubmit = async () => {
    if (!form.appointmentId) { setError("Selecciona una cita"); return; }
    setSaving(true);
    setError("");
    const { error: apiError } = await apiCall("/api/payments", "POST", {
      appointmentId: form.appointmentId,
      method: form.method,
      amount: Number(form.amount || selectedAppt?.total || 0),
      status: form.status,
      reference: form.reference || undefined,
    });
    setSaving(false);
    if (apiError) { setError(apiError); return; }
    onCreated();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#18181C] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-100">Registrar pago</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Deja trazabilidad operativa del cobro por cita.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>Cita</label>
            <select
              value={form.appointmentId}
              onChange={(e) => {
                const appt = appointments.find((a) => a.id === e.target.value);
                setForm((p) => ({ ...p, appointmentId: e.target.value, amount: appt?.total?.toString() ?? p.amount }));
              }}
              className={FIELD_CLASS}
            >
              <option value="">Selecciona una cita</option>
              {appointments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.client.name} · {a.service.name} — {formatCOP(a.total)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Metodo de pago</label>
            <select value={form.method} onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))} className={FIELD_CLASS}>
              {Object.entries(METHOD_CONFIG).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Monto (COP)</label>
            <input
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder={selectedAppt ? String(selectedAppt.total) : "0"}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Estado</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={FIELD_CLASS}>
              {Object.entries(STATUS_CONFIG_PAY).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Referencia (opcional)</label>
            <input
              value={form.reference}
              onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
              placeholder="Comprobante, ref. transferencia..."
              className={FIELD_CLASS}
            />
          </div>
          {selectedAppt && (
            <div className="md:col-span-2 rounded-xl border border-gold-b bg-gold-subtle px-4 py-3 text-sm text-zinc-300">
              {selectedAppt.client.name} con {selectedAppt.barber.name} · {selectedAppt.service.name} ·{" "}
              <span className="font-semibold text-gold-light">{formatCOP(selectedAppt.total)}</span>
            </div>
          )}
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
            disabled={saving || !form.appointmentId}
            className="flex-1 rounded-xl border border-gold-b bg-gold-subtle px-4 py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] disabled:opacity-40"
          >
            {saving ? "Guardando..." : "Registrar pago"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PagosPage() {
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");

  const { data: payments, loading, refetch } = useApiList<PaymentRow>("/api/payments");
  const { data: appointments } = useApiList<AppointmentWithRelations>("/api/appointments?limit=100");

  const metrics = useMemo(() => {
    const paid = payments.filter((p) => p.status === "paid");
    const pending = payments.filter((p) => p.status === "pending");
    const failed = payments.filter((p) => p.status === "failed");
    const revenue = paid.reduce((s, p) => s + p.amount, 0);
    return { paid: paid.length, pending: pending.length, failed: failed.length, revenue };
  }, [payments]);

  const filtered = useMemo(() =>
    payments.filter((p) =>
      (filterStatus === "all" || p.status === filterStatus) &&
      (filterMethod === "all" || p.method === filterMethod),
    ),
    [payments, filterStatus, filterMethod],
  );

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-950">
      <Header title="Pagos" />

      {showModal && (
        <RegisterPaymentModal
          appointments={appointments}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); refetch(); }}
        />
      )}

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-7 py-6">
        {/* Metrics */}
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Cobrados", value: metrics.paid, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Pendientes", value: metrics.pending, icon: Clock, color: "text-amber-400" },
            { label: "Fallidos", value: metrics.failed, icon: XCircle, color: "text-red-400" },
            { label: "Ingresos totales", value: formatCOP(metrics.revenue), icon: TrendingUp, color: "text-gold-light" },
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

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.05] bg-[#111113]">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] px-5 py-4">
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-zinc-600" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-white/[0.06] bg-zinc-800/60 px-3 py-2 text-[12px] text-zinc-400 outline-none"
              >
                <option value="all">Todos los estados</option>
                {Object.entries(STATUS_CONFIG_PAY).map(([v, { label }]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="rounded-lg border border-white/[0.06] bg-zinc-800/60 px-3 py-2 text-[12px] text-zinc-400 outline-none"
              >
                <option value="all">Todos los metodos</option>
                {Object.entries(METHOD_CONFIG).map(([v, { label }]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl border border-gold-b bg-gold-subtle px-4 py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)]"
            >
              <Plus size={14} />
              Registrar pago
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_160px_160px_110px_100px] gap-3 border-b border-white/[0.04] px-5 py-3">
            {["Cliente y cita", "Metodo", "Monto", "Estado", "Fecha"].map((label) => (
              <div key={label} className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{label}</div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse border-b border-white/[0.03] bg-zinc-800/20" />
            ))
          ) : filtered.length > 0 ? (
            filtered.map((payment) => {
              const methodCfg = METHOD_CONFIG[payment.method];
              const statusCfg = STATUS_CONFIG_PAY[payment.status];
              return (
                <div
                  key={payment.id}
                  className="grid grid-cols-[1fr_160px_160px_110px_100px] items-center gap-3 border-b border-white/[0.03] px-5 py-4 transition hover:bg-zinc-800/20"
                >
                  <div>
                    <div className="text-sm font-medium text-zinc-100">{payment.client.name}</div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {payment.appointment.service.name} · {payment.appointment.barber.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={methodCfg?.color ?? "text-zinc-400"}>{methodCfg?.icon}</span>
                    <div>
                      <div className="text-sm text-zinc-300">{methodCfg?.label ?? payment.method}</div>
                      {payment.reference && (
                        <div className="text-xs text-zinc-600">Ref. {payment.reference}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gold-light">{formatCOP(payment.amount)}</div>
                  <div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium ${statusCfg?.color} ${statusCfg?.bg} ${statusCfg?.border}`}>
                      {statusCfg?.icon}
                      {statusCfg?.label ?? payment.status}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-500">
                    {new Date(payment.paidAt ?? payment.createdAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.06] bg-zinc-800/60">
                <CreditCard size={22} className="text-zinc-500" />
              </div>
              <h3 className="text-base font-semibold text-zinc-200">
                {filterStatus !== "all" || filterMethod !== "all" ? "Sin resultados" : "Sin pagos registrados"}
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                {filterStatus !== "all" || filterMethod !== "all"
                  ? "Cambia los filtros para ver otros pagos."
                  : "Registra el primer cobro para llevar trazabilidad operativa."}
              </p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="border-t border-white/[0.04] bg-zinc-800/20 px-5 py-3">
              <span className="text-[11.5px] text-zinc-600">{filtered.length} pagos</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

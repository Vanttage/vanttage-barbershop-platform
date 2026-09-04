"use client";

import { useMemo, useState } from "react";
import Header from "@/src/components/admin/dashboard/Header";
import { apiCall, useApi, useApiPaginated } from "@/src/hooks/useApi";
import { formatCOP } from "@/src/types";
import {
  Wallet,
  Lock,
  Unlock,
  Plus,
  Banknote,
  Smartphone,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  History,
  X,
  Clock,
} from "lucide-react";

// ── Tipos (reflejan la respuesta de las rutas /api/cash-sessions*) ────────

interface CashSummary {
  incomeCash: number;
  incomeDigital: number;
  totalIncome: number;
  paymentCount: number;
  expensesCash: number;
  expensesDigital: number;
  adjustmentsCash: number;
  adjustmentsDigital: number;
  expectedCash: number;
}

interface CashSessionData {
  id: string;
  openingAmount: number;
  expectedCash: number | null;
  countedCash: number | null;
  difference: number | null;
  status: "open" | "closed";
  closeNote: string | null;
  openedAt: string;
  closedAt: string | null;
  openedBy: { id: string; name: string } | null;
  closedBy: { id: string; name: string } | null;
  summary?: CashSummary | null;
}

interface PaymentEntry {
  id: string;
  amount: number;
  method: "cash" | "transfer" | "card" | "nequi" | "daviplata";
  paidAt: string;
  client: { id: string; name: string };
  appointment: { id: string; service: { name: string } };
}

interface MovementEntry {
  id: string;
  type: "expense" | "adjustment";
  amount: number;
  method: "cash" | "transfer" | "card" | "nequi" | "daviplata";
  concept: string;
  category: string | null;
  note: string | null;
  createdAt: string;
  actor: { id: string; name: string } | null;
}

interface CurrentSessionResponse {
  session: CashSessionData;
  summary: CashSummary;
  payments: PaymentEntry[];
  movements: MovementEntry[];
}

const METHOD_CONFIG: Record<string, { label: string; icon: React.ReactNode; isCash: boolean }> = {
  cash: { label: "Efectivo", icon: <Banknote size={12} />, isCash: true },
  transfer: { label: "Transferencia", icon: <ArrowRightLeft size={12} />, isCash: false },
  nequi: { label: "Nequi", icon: <Smartphone size={12} />, isCash: false },
  daviplata: { label: "Daviplata", icon: <Smartphone size={12} />, isCash: false },
  card: { label: "Tarjeta", icon: <ArrowRightLeft size={12} />, isCash: false },
};

const CATEGORIES = ["Productos", "Servicios", "Transporte", "Alimentacion", "Mantenimiento", "Otros"];

const FIELD_CLASS =
  "w-full rounded-xl border border-white/[0.06] bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-gold-border placeholder:text-zinc-600";
const LABEL_CLASS = "mb-1.5 block text-[10.5px] uppercase tracking-[0.12em] text-zinc-500";

function formatThousands(digits: string): string {
  if (!digits) return "";
  return new Intl.NumberFormat("es-CO").format(Number(digits));
}
function onlyDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

// ── Abrir caja ──────────────────────────────────────────────────────────

function OpenCashModal({ onClose, onOpened }: { onClose: () => void; onOpened: () => void }) {
  const [amount, setAmount] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    const { error: err } = await apiCall("/api/cash-sessions", "POST", {
      openingAmount: Number(amount || 0),
    });
    setSaving(false);
    if (err) { setError(err); return; }
    onOpened();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#18181C] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="font-display text-base font-semibold text-zinc-100">Abrir caja</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">
          <label className={LABEL_CLASS}>Cuanto dinero tienes ahora en caja</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={formatThousands(amount)}
              onChange={(e) => setAmount(onlyDigits(e.target.value))}
              className={`${FIELD_CLASS} pl-7`}
              autoFocus
            />
          </div>
          <p className="mt-2 text-xs text-zinc-600">
            Ese dinero no es una venta — es con lo que empiezas el dia. Se usara para calcular el efectivo esperado al cerrar.
          </p>
        </div>
        {error && (
          <div className="mx-6 mb-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        <div className="flex gap-3 border-t border-white/[0.06] px-6 py-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-400 transition hover:text-zinc-200">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-40"
          >
            {saving ? "Abriendo..." : "Abrir caja"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Registrar gasto / ajuste ───────────────────────────────────────────────

function AddMovementModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState<"expense" | "adjustment">("expense");
  const [direction, setDirection] = useState<"in" | "out">("out");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [concept, setConcept] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!concept.trim() || !amount) { setError("Completa el concepto y el monto"); return; }
    setSaving(true);
    setError("");
    const { error: err } = await apiCall("/api/cash-movements", "POST", {
      type,
      amount: Number(amount),
      direction: type === "expense" ? "out" : direction,
      method,
      concept: concept.trim(),
      category: category || undefined,
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (err) { setError(err); return; }
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#18181C] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="font-display text-base font-semibold text-zinc-100">Registrar movimiento</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div>
            <label className={LABEL_CLASS}>Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`rounded-xl border px-3 py-2.5 text-sm transition ${type === "expense" ? "border-red-400/30 bg-red-400/10 text-red-300" : "border-white/[0.06] bg-zinc-800/60 text-zinc-400"}`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setType("adjustment")}
                className={`rounded-xl border px-3 py-2.5 text-sm transition ${type === "adjustment" ? "border-blue-400/30 bg-blue-400/10 text-blue-300" : "border-white/[0.06] bg-zinc-800/60 text-zinc-400"}`}
              >
                Ajuste
              </button>
            </div>
          </div>

          {type === "adjustment" && (
            <div>
              <label className={LABEL_CLASS}>El ajuste...</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDirection("in")} className={`rounded-lg border px-3 py-2 text-[12.5px] transition ${direction === "in" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/[0.06] text-zinc-500"}`}>
                  Suma a caja
                </button>
                <button type="button" onClick={() => setDirection("out")} className={`rounded-lg border px-3 py-2 text-[12.5px] transition ${direction === "out" ? "border-red-400/30 bg-red-400/10 text-red-300" : "border-white/[0.06] text-zinc-500"}`}>
                  Resta de caja
                </button>
              </div>
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Concepto</label>
            <input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Compra de productos" className={FIELD_CLASS} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Monto</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatThousands(amount)}
                  onChange={(e) => setAmount(onlyDigits(e.target.value))}
                  className={`${FIELD_CLASS} pl-7`}
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Metodo</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={FIELD_CLASS}>
                {Object.entries(METHOD_CONFIG).map(([v, cfg]) => (
                  <option key={v} value={v}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Categoria (opcional)</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={FIELD_CLASS}>
              <option value="">Sin categoria</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Nota (opcional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detalle adicional" className={FIELD_CLASS} />
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div className="flex gap-3 border-t border-white/[0.06] px-6 py-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-400 transition hover:text-zinc-200">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl border border-gold-border bg-gold-subtle px-4 py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] disabled:opacity-40"
          >
            {saving ? "Guardando..." : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cerrar caja ─────────────────────────────────────────────────────────

function CloseCashModal({
  data,
  onClose,
  onClosed,
}: {
  data: CurrentSessionResponse;
  onClose: () => void;
  onClosed: () => void;
}) {
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const countedNum = Number(counted || 0);
  const difference = counted ? countedNum - data.summary.expectedCash : null;

  const handleSubmit = async () => {
    if (!counted) { setError("Cuenta el efectivo antes de cerrar"); return; }
    setSaving(true);
    setError("");
    const { error: err } = await apiCall(`/api/cash-sessions/${data.session.id}/close`, "PATCH", {
      countedCash: countedNum,
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (err) { setError(err); return; }
    onClosed();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#18181C] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="font-display text-base font-semibold text-zinc-100">Cierre de caja</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-6">
          <div className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-zinc-800/40 p-4 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Apertura</span>
              <span className="tabular-nums text-zinc-200">{formatCOP(data.session.openingAmount)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Ingresos en efectivo</span>
              <span className="tabular-nums text-emerald-400">+{formatCOP(data.summary.incomeCash)}</span>
            </div>
            {data.summary.expensesCash > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Gastos en efectivo</span>
                <span className="tabular-nums text-red-400">-{formatCOP(data.summary.expensesCash)}</span>
              </div>
            )}
            {data.summary.adjustmentsCash !== 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Ajustes en efectivo</span>
                <span className={`tabular-nums ${data.summary.adjustmentsCash > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {data.summary.adjustmentsCash > 0 ? "+" : ""}{formatCOP(data.summary.adjustmentsCash)}
                </span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-white/[0.06] pt-2 text-sm font-semibold">
              <span className="text-zinc-300">Efectivo esperado</span>
              <span className="tabular-nums text-gold-light">{formatCOP(data.summary.expectedCash)}</span>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Cuanto efectivo tienes fisicamente</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatThousands(counted)}
                onChange={(e) => setCounted(onlyDigits(e.target.value))}
                className={`${FIELD_CLASS} pl-7`}
                autoFocus
              />
            </div>
          </div>

          {difference !== null && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              difference === 0
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                : "border-amber-400/25 bg-amber-400/10 text-amber-300"
            }`}>
              <div className="flex items-center gap-2 font-medium">
                {difference === 0 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {difference === 0 ? "Caja cuadrada" : "Diferencia de caja"}
              </div>
              {difference !== 0 && (
                <p className="mt-1 tabular-nums">
                  {difference > 0 ? "Sobran " : "Faltan "}
                  {formatCOP(Math.abs(difference))}
                </p>
              )}
            </div>
          )}

          {difference !== null && difference !== 0 && (
            <div>
              <label className={LABEL_CLASS}>Motivo (opcional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. se dio mal el cambio" className={FIELD_CLASS} />
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 mb-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div className="flex gap-3 border-t border-white/[0.06] px-6 py-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-400 transition hover:text-zinc-200">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl border border-gold-border bg-gold-subtle px-4 py-2.5 text-sm font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)] disabled:opacity-40"
          >
            {saving ? "Cerrando..." : "Confirmar cierre"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────

export default function CajaPage() {
  const [showOpen, setShowOpen] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data, loading, refetch } = useApi<CurrentSessionResponse | null>("/api/cash-sessions/current");
  const { data: history, pagination: historyPagination } = useApiPaginated<CashSessionData>(
    showHistory ? "/api/cash-sessions?limit=10" : "",
  );

  const feed = useMemo(() => {
    if (!data) return [];
    type Entry = { id: string; time: string; kind: "income" | "expense" | "adjustment"; label: string; sublabel: string; amount: number; method: string };
    const income: Entry[] = data.payments.map((p) => ({
      id: `pay-${p.id}`,
      time: p.paidAt,
      kind: "income",
      label: p.client.name,
      sublabel: p.appointment.service.name,
      amount: p.amount,
      method: p.method,
    }));
    const movs: Entry[] = data.movements.map((m) => ({
      id: `mov-${m.id}`,
      time: m.createdAt,
      kind: m.type,
      label: m.concept,
      sublabel: m.category ?? (m.type === "expense" ? "Gasto" : "Ajuste"),
      amount: m.amount,
      method: m.method,
    }));
    return [...income, ...movs].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [data]);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-950">
      <Header title="Caja" />

      {showOpen && <OpenCashModal onClose={() => setShowOpen(false)} onOpened={() => { setShowOpen(false); refetch(); }} />}
      {showMovement && <AddMovementModal onClose={() => setShowMovement(false)} onCreated={() => { setShowMovement(false); refetch(); }} />}
      {showClose && data && (
        <CloseCashModal data={data} onClose={() => setShowClose(false)} onClosed={() => { setShowClose(false); refetch(); }} />
      )}

      <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-5 px-4 py-5 sm:px-7 sm:py-6">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800/40" />
            ))}
          </div>
        ) : !data ? (
          /* Sin caja abierta */
          <div className="rounded-2xl border border-dashed border-white/[0.08] bg-zinc-900/30 px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.06] bg-zinc-800/60">
              <Lock size={22} className="text-zinc-500" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200">No tienes una caja abierta</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Abre la caja al empezar el dia para llevar el control del efectivo.
            </p>
            <button
              type="button"
              onClick={() => setShowOpen(true)}
              className="mt-5 mx-auto flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20"
            >
              <Unlock size={14} />
              Abrir caja
            </button>
            {historyToggle(showHistory, setShowHistory)}
            {showHistory && <HistoryList sessions={history} pages={historyPagination?.pages ?? 1} />}
          </div>
        ) : (
          <>
            {/* Estado */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Caja abierta</span>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock size={11} />
                  Desde {new Date(data.session.openedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  {data.session.openedBy ? ` · ${data.session.openedBy.name}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMovement(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-3.5 py-2 text-[12.5px] text-zinc-300 transition hover:border-white/[0.16]"
                >
                  <Plus size={13} />
                  Registrar movimiento
                </button>
                <button
                  type="button"
                  onClick={() => setShowClose(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-gold-border bg-gold-subtle px-3.5 py-2 text-[12.5px] font-medium text-gold-light transition hover:bg-[rgba(201,168,76,0.18)]"
                >
                  <Lock size={13} />
                  Cerrar caja
                </button>
              </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/[0.04] bg-[#111113] px-4 py-3.5">
                <div className="text-[10px] uppercase tracking-wider text-zinc-600">Total del dia</div>
                <div className="mt-1 text-xl font-semibold text-gold-light">{formatCOP(data.summary.totalIncome)}</div>
                <div className="mt-0.5 text-[11px] text-zinc-600">{data.summary.paymentCount} pagos</div>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-[#111113] px-4 py-3.5">
                <div className="text-[10px] uppercase tracking-wider text-zinc-600">Efectivo</div>
                <div className="mt-1 text-xl font-semibold text-emerald-400">{formatCOP(data.summary.incomeCash)}</div>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-[#111113] px-4 py-3.5">
                <div className="text-[10px] uppercase tracking-wider text-zinc-600">Digital</div>
                <div className="mt-1 text-xl font-semibold text-blue-400">{formatCOP(data.summary.incomeDigital)}</div>
              </div>
              <div className="rounded-xl border border-gold-border bg-gold-subtle px-4 py-3.5">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Efectivo en caja</div>
                <div className="mt-1 text-xl font-semibold text-gold-light">{formatCOP(data.summary.expectedCash)}</div>
              </div>
            </div>

            {(data.summary.expensesCash > 0 || data.summary.expensesDigital > 0) && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <TrendingDown size={12} className="text-red-400" />
                Gastos del dia: {formatCOP(data.summary.expensesCash + data.summary.expensesDigital)}
                {data.summary.expensesDigital > 0 && ` (${formatCOP(data.summary.expensesCash)} efectivo, ${formatCOP(data.summary.expensesDigital)} digital)`}
              </div>
            )}

            {/* Movimientos */}
            <section className="overflow-hidden rounded-2xl border border-white/[0.05] bg-[#111113]">
              <div className="border-b border-white/[0.04] px-5 py-3.5">
                <h2 className="text-sm font-semibold text-zinc-100">Movimientos</h2>
              </div>
              {feed.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-zinc-600">
                  Todavia no hay movimientos en esta jornada.
                </div>
              ) : (
                feed.map((entry) => {
                  const methodCfg = METHOD_CONFIG[entry.method];
                  const isPositive = entry.amount > 0;
                  return (
                    <div key={entry.id} className="flex items-center justify-between gap-3 border-b border-white/[0.03] px-5 py-3 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isPositive ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-zinc-100">{entry.label}</div>
                          <div className="text-[11px] text-zinc-500">
                            {entry.sublabel} · {new Date(entry.time).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold tabular-nums ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                          {isPositive ? "+" : ""}{formatCOP(entry.amount)}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-[10.5px] text-zinc-600">
                          {methodCfg?.icon}
                          {methodCfg?.label ?? entry.method}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            {historyToggle(showHistory, setShowHistory)}
            {showHistory && <HistoryList sessions={history} pages={historyPagination?.pages ?? 1} />}
          </>
        )}
      </main>
    </div>
  );
}

function historyToggle(show: boolean, setShow: (v: boolean) => void) {
  return (
    <button
      type="button"
      onClick={() => setShow(!show)}
      className="flex items-center gap-1.5 self-start text-[12.5px] text-zinc-500 transition hover:text-zinc-300"
    >
      <History size={13} />
      {show ? "Ocultar historial" : "Ver historial de cajas"}
    </button>
  );
}

function HistoryList({ sessions, pages }: { sessions: CashSessionData[]; pages: number }) {
  const closed = sessions.filter((s) => s.status === "closed");
  if (closed.length === 0) {
    return <p className="text-sm text-zinc-600">Todavia no hay cajas cerradas.</p>;
  }
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.05] bg-[#111113]">
      {closed.map((s) => {
        const ok = (s.difference ?? 0) === 0;
        return (
          <div key={s.id} className="flex items-center justify-between gap-3 border-b border-white/[0.03] px-5 py-3.5 last:border-b-0">
            <div>
              <div className="text-[13px] font-medium text-zinc-100">
                {new Date(s.openedAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
              <div className="text-[11px] text-zinc-500">
                Esperado {formatCOP(s.expectedCash ?? 0)} · Contado {formatCOP(s.countedCash ?? 0)}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-medium">
              {ok ? (
                <span className="flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-emerald-400">
                  <CheckCircle2 size={11} /> Cuadrada
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-amber-400">
                  <AlertTriangle size={11} />
                  {(s.difference ?? 0) > 0 ? "+" : ""}{formatCOP(s.difference ?? 0)}
                </span>
              )}
            </div>
          </div>
        );
      })}
      {pages > 1 && (
        <div className="px-5 py-3 text-[11px] text-zinc-600">Mostrando la pagina mas reciente ({pages} en total)</div>
      )}
    </section>
  );
}

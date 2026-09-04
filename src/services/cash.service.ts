import { prisma } from "@/src/lib/prisma";

/**
 * Caja ≠ Pagos. Pagos registra cada cobro individual; Caja controla el
 * dinero de la jornada. Por eso el resumen de una jornada NUNCA guarda los
 * ingresos como su propia fila — los calcula en vivo a partir de Payment
 * (status=paid, paidAt dentro de la ventana de la jornada). Lo único que
 * vive en CashMovement son los gastos y ajustes, que Payment no modela.
 */

export interface CashSummary {
  incomeCash: number;
  incomeDigital: number;
  totalIncome: number;
  paymentCount: number;
  expensesCash: number;
  expensesDigital: number;
  adjustmentsCash: number;
  adjustmentsDigital: number;
  /** Efectivo que debería haber físicamente: apertura + efectivo cobrado
   *  - gastos en efectivo + ajustes en efectivo. Los movimientos digitales
   *  nunca tocan esta cifra — no mueven el cajón físico. */
  expectedCash: number;
}

export async function computeCashSummary(
  tenantId: string,
  barbershopId: string,
  session: { id: string; openingAmount: number; openedAt: Date; closedAt: Date | null },
): Promise<CashSummary> {
  const windowEnd = session.closedAt ?? new Date();

  const [payments, movements] = await Promise.all([
    prisma.payment.findMany({
      where: {
        tenantId,
        barbershopId,
        status: "paid",
        paidAt: { gte: session.openedAt, lte: windowEnd },
      },
      select: { amount: true, method: true },
    }),
    prisma.cashMovement.findMany({
      where: { cashSessionId: session.id },
      select: { amount: true, method: true, type: true },
    }),
  ]);

  let incomeCash = 0;
  let incomeDigital = 0;
  for (const p of payments) {
    if (p.method === "cash") incomeCash += p.amount;
    else incomeDigital += p.amount;
  }

  let expensesCash = 0;
  let expensesDigital = 0;
  let adjustmentsCash = 0;
  let adjustmentsDigital = 0;
  for (const m of movements) {
    const isCash = m.method === "cash";
    if (m.type === "expense") {
      if (isCash) expensesCash += Math.abs(m.amount);
      else expensesDigital += Math.abs(m.amount);
    } else if (isCash) {
      adjustmentsCash += m.amount;
    } else {
      adjustmentsDigital += m.amount;
    }
  }

  const expectedCash = session.openingAmount + incomeCash - expensesCash + adjustmentsCash;

  return {
    incomeCash,
    incomeDigital,
    totalIncome: incomeCash + incomeDigital,
    paymentCount: payments.length,
    expensesCash,
    expensesDigital,
    adjustmentsCash,
    adjustmentsDigital,
    expectedCash,
  };
}

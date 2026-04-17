// ── Automation keys — compartido entre route y page ───────────────────────────
// Separado del route file para no violar las restricciones de exports de
// Next.js App Router (solo permite exportar handlers HTTP + config).

export const AUTOMATION_KEYS = [
  "autoConfirmacion",
  "autoReminder24h",
  "autoReminder1h",
  "autoReviewRequest",
  "autoReactivacion",
  "autoWeeklyReport",
] as const;

export type AutomationKey = (typeof AUTOMATION_KEYS)[number];

// Normaliza número colombiano a E.164.
// Entrada:  3001234567 | +573001234567 | 573001234567
// Salida:   +573001234567  (E.164 completo con +)
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("3")) return `+57${digits}`;
  // Si ya trae código de país genérico
  if (digits.length > 10) return `+${digits}`;
  return `+57${digits}`;
}

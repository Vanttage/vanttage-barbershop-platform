// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · src/lib/apiCache.ts
//
//  Cache TTL en proceso para respuestas de API.
//  Evita recalcular 14+ queries de DB en cada carga del dashboard.
//
//  - Clave por barbershopId (aislamiento multi-tenant)
//  - invalidate() para limpiar tras mutaciones
//  - Implementación con Map + WeakRef a intervalos de limpieza cada 5 min
// ─────────────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Separate stores per "namespace" para evitar colisiones de claves
const store = new Map<string, CacheEntry<unknown>>();

// ── Limpieza de entradas expiradas cada 5 min ─────────────────────────────────
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.expiresAt) store.delete(key);
    }
  }, 5 * 60_000);
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Lee una entrada del cache. Retorna null si expiró o no existe. */
export function getCached<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

/** Guarda un valor en el cache con un TTL en milisegundos. */
export function setCached<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Invalida todas las entradas cuya clave comienza con `prefix`.
 * Útil para invalidar por tenant o barbershop tras una mutación.
 *
 * @example invalidateByPrefix(`dashboard:${barbershopId}`)
 */
export function invalidateByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Invalida una clave exacta. */
export function invalidate(key: string): void {
  store.delete(key);
}

/** Estadísticas del cache (útil para debug). */
export function cacheStats(): { size: number; keys: string[] } {
  return { size: store.size, keys: [...store.keys()] };
}

// ─────────────────────────────────────────────────────────────────
//  VANTTAGE · src/hooks/useApi.ts
//
//  Hooks y helper para llamadas a la API.
//
//  Fixes vs versión anterior:
//  · options estabilizado con useRef → elimina re-renders infinitos
//    cuando se pasa un objeto literal como segundo argumento
//  · AbortController real con signal en el fetch → cancela la
//    request de red, no solo una variable local
//  · Timeout de 15 s en useApi y apiCall → evita requests colgadas
//  · Distingue AbortError de error de red en el catch
// ─────────────────────────────────────────────────────────────────

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_TIMEOUT_MS = 15_000;

// ── Tipos ─────────────────────────────────────────────────────────

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface ApiCallResult<T> {
  data: T | null;
  error: string | null;
}

// ── useApi ────────────────────────────────────────────────────────

export function useApi<T>(url: string, options?: RequestInit): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  // Guardar options en una ref para no incluirla en las deps del
  // effect. Si el caller pasa un literal {} en cada render, sin esto
  // el effect correría en bucle infinito.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(url, {
          ...optionsRef.current,
          signal: controller.signal,
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? `Error ${res.status}`);
          setData(null);
        } else {
          // Soporta { data: [...] } y respuesta directa
          setData(json.data !== undefined ? json.data : json);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setError("Tiempo de espera agotado");
        } else {
          setError("Error de conexión");
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    load();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [url, trigger]); // options intencionalmente fuera → estabilizada por ref

  return { data, loading, error, refetch };
}

// ── useApiList ────────────────────────────────────────────────────
// Wrapper sobre useApi que garantiza siempre un array,
// evitando el null check en cada componente.

export function useApiList<T>(url: string): {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { data, loading, error, refetch } = useApi<T[]>(url);
  return { data: data ?? [], loading, error, refetch };
}

// ── apiCall ───────────────────────────────────────────────────────
// Helper para mutaciones (POST / PATCH / DELETE).
// Retorna { data, error } en lugar de lanzar, para que el caller
// maneje el error sin try/catch en cada componente.

export async function apiCall<T>(
  url: string,
  method: "POST" | "PATCH" | "DELETE" = "POST",
  body?: unknown,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<ApiCallResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: json.error ?? `Error ${res.status}` };
    }

    return { data: json.data ?? json, error: null };
  } catch (err) {
    const isTimeout = (err as Error).name === "AbortError";
    return {
      data: null,
      error: isTimeout ? "Tiempo de espera agotado" : "Error de conexión",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

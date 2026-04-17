"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · app/global-error.tsx
//
//  Captura errores de render de React y los reporta a Sentry.
//  Requerido por Sentry para errores del App Router.
// ─────────────────────────────────────────────────────────────────────────────

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* Pantalla de error mínima — Sentry ya capturó el detalle */}
        <div
          style={{
            minHeight: "100vh",
            background: "#09090B",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            fontFamily: "system-ui, sans-serif",
            color: "#A1A1AA",
          }}
        >
          <div style={{ fontSize: "32px" }}>⚠️</div>
          <h2 style={{ color: "#F4F4F5", margin: 0, fontSize: "18px" }}>
            Ocurrió un error inesperado
          </h2>
          <p style={{ margin: 0, fontSize: "14px" }}>
            El equipo ha sido notificado automáticamente.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "8px",
              padding: "10px 24px",
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.35)",
              borderRadius: "10px",
              color: "#D4A843",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Intentar de nuevo
          </button>
        </div>
        {/* next/error necesita un statusCode */}
        <NextError statusCode={undefined as unknown as number} />
      </body>
    </html>
  );
}

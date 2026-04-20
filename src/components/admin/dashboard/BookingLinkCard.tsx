"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/src/hooks/useApi";
import type { PublicBarbershop } from "@/src/types";

export default function BookingLinkCard() {
  const { data: shop } = useApi<PublicBarbershop>("/api/public/barbershop");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  // window solo disponible en el navegador
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!shop?.tenantSlug || !origin) return null;

  const bookingUrl = `${origin}/${shop.tenantSlug}/reservar`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.04] bg-[#111113] px-4 py-3 sm:px-5 sm:py-3.5">
      {/* Link icon — inline SVG, sin depender de lucide */}
      <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="shrink-0 text-gold/50"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-zinc-600">
          Link de reservas · compártelo con tus clientes
        </p>
        <p className="mt-0.5 truncate font-mono text-[12px] text-zinc-400">
          {bookingUrl}
        </p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gold/20 bg-gold-subtle px-3 py-1.5 text-[12px] font-medium text-gold-light transition hover:bg-gold/[0.18]"
      >
        {copied ? (
          <>
            {/* Check icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            ¡Copiado!
          </>
        ) : (
          <>
            {/* Copy icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copiar
          </>
        )}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Link2, Copy, Check } from "lucide-react";

interface Props {
  tenantSlug: string;
}

export default function BookingLinkCard({ tenantSlug }: Props) {
  const [copied, setCopied] = useState(false);

  if (!tenantSlug) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const bookingUrl = `${origin}/${tenantSlug}/reservar`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.04] bg-[#111113] px-4 py-3 sm:px-5 sm:py-3.5">
      <Link2 size={15} className="shrink-0 text-gold/50" />

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
            <Check size={12} />
            ¡Copiado!
          </>
        ) : (
          <>
            <Copy size={12} />
            Copiar
          </>
        )}
      </button>
    </div>
  );
}

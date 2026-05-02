"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Star, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type ReviewData = {
  alreadySubmitted: boolean;
  rating: number | null;
  comment: string | null;
  barber: { id: string; name: string; specialty: string | null; photoUrl: string | null };
  client: { id: string; name: string };
  barbershop: { id: string; name: string; logoUrl: string | null };
  serviceName: string;
  appointmentDate: string;
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform active:scale-110"
        >
          <Star
            size={36}
            className="transition-colors"
            fill={(hovered || value) >= n ? "#F59E0B" : "transparent"}
            stroke={(hovered || value) >= n ? "#F59E0B" : "#52525B"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

export default function ResenaPage() {
  const { token } = useParams<{ token: string }>();
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/reviews/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(json.error); }
        else { setReview(json.data); }
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    if (!rating) { setError("Por favor selecciona una calificación"); return; }
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/public/reviews/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(json.error ?? "Error al enviar"); return; }
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin text-zinc-500" size={28} />
      </div>
    );
  }

  if (error && !review) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
          <p className="text-zinc-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!review) return null;

  const apptDate = new Date(review.appointmentDate).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (submitted || review.alreadySubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-sm text-center">
          <CheckCircle size={56} className="mx-auto mb-4 text-emerald-400" />
          <h1 className="text-xl font-semibold text-zinc-100">
            ¡Gracias, {review.client.name.split(" ")[0]}!
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Tu reseña ayuda a {review.barbershop.name} a seguir mejorando.
          </p>
          {(submitted ? rating : review.rating ?? 0) > 0 && (
            <div className="mt-5 flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={24}
                  fill={(submitted ? rating : review.rating ?? 0) >= n ? "#F59E0B" : "transparent"}
                  stroke={(submitted ? rating : review.rating ?? 0) >= n ? "#F59E0B" : "#52525B"}
                  strokeWidth={1.5}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-5">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-lg font-semibold text-zinc-300">
            {review.barbershop.name.slice(0, 2).toUpperCase()}
          </div>
          <h1 className="text-xl font-semibold text-zinc-100">
            ¿Cómo te fue en {review.barbershop.name}?
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            {review.serviceName} con{" "}
            <span className="text-zinc-300">{review.barber.name}</span> · {apptDate}
          </p>
        </div>

        {/* Rating */}
        <div className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="mb-4 text-center text-sm font-medium text-zinc-400">
            Califica tu experiencia
          </p>
          <div className="flex justify-center">
            <StarRating value={rating} onChange={setRating} />
          </div>
          {rating > 0 && (
            <p className="mt-2 text-center text-[13px] font-medium text-amber-400">
              {RATING_LABELS[rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="mb-4">
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos más sobre tu experiencia (opcional)"
            className="w-full resize-none rounded-xl border border-white/[0.06] bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-400/40 placeholder:text-zinc-600"
          />
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !rating}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {submitting ? "Enviando..." : "Enviar reseña"}
        </button>

        <p className="mt-4 text-center text-xs text-zinc-600">
          Tu opinión es privada y solo visible para el negocio.
        </p>
      </div>
    </div>
  );
}

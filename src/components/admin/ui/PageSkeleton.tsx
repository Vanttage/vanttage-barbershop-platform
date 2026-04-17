// ─────────────────────────────────────────────────────────────────────────────
//  VANTTAGE · src/components/admin/ui/PageSkeleton.tsx
//
//  Skeleton genérico reutilizable para los loading.tsx de cada ruta.
//  Simula el layout real: header fijo + área de contenido con cards shimmer.
// ─────────────────────────────────────────────────────────────────────────────

interface SkeletonProps {
  /** Número de bloques de contenido a mostrar (default 3) */
  blocks?: number;
  /** Muestra un grid 2 columnas como las tarjetas de stats (default false) */
  statsGrid?: boolean;
}

function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`}
      aria-hidden
    />
  );
}

export default function PageSkeleton({ blocks = 3, statsGrid = false }: SkeletonProps) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-950">
      {/* ── Header skeleton ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.05] bg-[#0e0e10]/95 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <Shimmer className="h-6 w-36 sm:w-48" />
        </div>
        <div className="flex items-center gap-2.5">
          <Shimmer className="hidden h-9 w-32 md:block" />
          <Shimmer className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* ── Content skeleton ─────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-7">

        {/* Stats grid — 4 tarjetas en fila (aparece cuando statsGrid=true) */}
        {statsGrid && (
          <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.04] bg-[#111113] p-5"
              >
                <Shimmer className="mb-3 h-3 w-24" />
                <Shimmer className="mb-2 h-8 w-20" />
                <Shimmer className="h-3 w-16" />
              </div>
            ))}
          </div>
        )}

        {/* Bloques de contenido */}
        <div className="flex flex-col gap-5">
          {Array.from({ length: blocks }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-white/[0.04] bg-[#111113]"
            >
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
                <div className="space-y-1.5">
                  <Shimmer className={`h-4 ${i === 0 ? "w-40" : i === 1 ? "w-32" : "w-36"}`} />
                  <Shimmer className="h-3 w-24" />
                </div>
                <Shimmer className="h-7 w-20 rounded-lg" />
              </div>

              {/* Card rows */}
              <div className="divide-y divide-white/[0.03]">
                {Array.from({ length: i === 0 ? 5 : 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3 px-5 py-3.5">
                    <Shimmer className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Shimmer className="h-3.5 w-36" />
                      <Shimmer className="h-3 w-24" />
                    </div>
                    <Shimmer className="h-5 w-16 rounded-full" />
                    <Shimmer className="h-5 w-12" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

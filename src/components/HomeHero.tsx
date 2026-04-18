"use client";

import Link from "next/link";

const features = [
  "Agenda online por barbero y sede",
  "Pagos, historial y clientes frecuentes",
  "Dashboard operativo con metricas de negocio",
  "Automatizaciones por WhatsApp y correo",
];

const stats = [
  ["Citas", "24"],
  ["Ingresos", "$1.2M"],
  ["Clientes", "136"],
  ["Asistencia", "92%"],
];

export default function HomeHero() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <style>{`
        /* ── Fade + slide up ──────────────────────────────────── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* ── Slide in from right ──────────────────────────────── */
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(44px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        /* ── Orbe respirando ─────────────────────────────────── */
        @keyframes breathe {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.12); }
        }
        /* ── Luz superior pulsando ───────────────────────────── */
        @keyframes glowPulse {
          0%, 100% { opacity: 0.8; }
          50%       { opacity: 1;   }
        }
        /* ── Dot online ──────────────────────────────────────── */
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        /* ── Puntos dorados ──────────────────────────────────── */
        @keyframes dotPulse {
          0%, 100% { transform: scale(1);   opacity: 0.7; }
          50%       { transform: scale(1.5); opacity: 1; }
        }
        /* ── Clases de entrada ──────────────────────────────── */
        .anim-fade-up   { opacity: 0; animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
        .anim-slide-in  { opacity: 0; animation: slideRight 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
        .d-0  { animation-delay: 0.05s; }
        .d-1  { animation-delay: 0.18s; }
        .d-2  { animation-delay: 0.32s; }
        .d-3  { animation-delay: 0.46s; }
        .d-4  { animation-delay: 0.28s; }
        .stat-0 { opacity: 0; animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.42s forwards; }
        .stat-1 { opacity: 0; animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.51s forwards; }
        .stat-2 { opacity: 0; animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.60s forwards; }
        .stat-3 { opacity: 0; animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.69s forwards; }
        .feat-0 { opacity: 0; animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.55s forwards; }
        .feat-1 { opacity: 0; animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.63s forwards; }
        .feat-2 { opacity: 0; animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.71s forwards; }
        .feat-3 { opacity: 0; animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.79s forwards; }
        .glow-orb   { animation: breathe   9s ease-in-out infinite; }
        .glow-top   { animation: glowPulse 6s ease-in-out infinite; }
        .dot-online { animation: blink     2.4s ease-in-out infinite; }
        .dot-0 { animation: dotPulse 2.5s ease-in-out 0.0s infinite; }
        .dot-1 { animation: dotPulse 2.5s ease-in-out 0.4s infinite; }
        .dot-2 { animation: dotPulse 2.5s ease-in-out 0.8s infinite; }
        .dot-3 { animation: dotPulse 2.5s ease-in-out 1.2s infinite; }
      `}</style>

      <section className="relative overflow-hidden border-b border-white/[0.05]">

        {/* Luz dorada superior */}
        <div
          className="glow-top pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 45% at 50% -8%, rgba(182,134,44,0.22), transparent)",
          }}
        />

        {/* Orbe ambiente inferior-derecho */}
        <div
          className="glow-orb pointer-events-none absolute -bottom-24 -right-24 h-[600px] w-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(182,134,44,0.07) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Ruido sutil */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />

        {/* Contenido */}
        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20 lg:flex-row lg:items-center lg:gap-16">

          {/* Left — copy */}
          <div className="max-w-2xl">
            <p className="anim-fade-up d-0 mb-4 text-xs font-medium uppercase tracking-[0.25em] text-gold">
              SaaS para barberias
            </p>
            <h1 className="anim-fade-up d-1 font-display text-5xl font-semibold leading-tight text-zinc-50 md:text-6xl">
              Gestiona agenda, equipo y clientes sin perder el estilo.
            </h1>
            <p className="anim-fade-up d-2 mt-6 max-w-xl text-base leading-7 text-zinc-400">
              VANTTAGE centraliza reservas, operacion diaria, pagos y fidelizacion
              en una sola plataforma lista para crecimiento multi-sede.
            </p>
            <div className="anim-fade-up d-3 mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-xl border border-gold-b bg-gold-subtle px-5 py-3 text-sm font-medium text-gold-light transition hover:bg-[rgba(182,134,44,0.18)]"
              >
                Crear barberia
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/[0.08] px-5 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/[0.18] hover:bg-white/[0.03]"
              >
                Entrar al panel
              </Link>
            </div>
          </div>

          {/* Right — card */}
          <div className="anim-slide-in d-4 relative mt-12 lg:mt-0 lg:w-[30rem]">
            {/* Glow detrás de la card */}
            <div
              className="glow-orb pointer-events-none absolute -inset-6 rounded-[3rem]"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(182,134,44,0.08), transparent)",
                filter: "blur(24px)",
              }}
            />

            <div className="relative grid gap-4 rounded-[2rem] border border-white/[0.06] bg-[#111113]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
              {/* Stats */}
              <div className="rounded-2xl border border-white/[0.05] bg-zinc-900/70 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">Operacion del dia</span>
                  <span className="dot-online rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-400">
                    En linea
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {stats.map(([label, value], i) => (
                    <div
                      key={label}
                      className={`stat-${i} rounded-xl border border-white/[0.05] bg-zinc-950/70 p-3`}
                    >
                      <p className="text-xs uppercase tracking-[0.14em] text-zinc-600">{label}</p>
                      <p className="mt-2 text-xl font-medium text-zinc-100">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="rounded-2xl border border-white/[0.05] bg-zinc-900/70 p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-600">Incluye</p>
                <div className="mt-4 space-y-3">
                  {features.map((item, i) => (
                    <div key={item} className={`feat-${i} flex items-center gap-3`}>
                      <span className={`dot-${i} h-2 w-2 flex-shrink-0 rounded-full bg-gold`} />
                      <span className="text-sm text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

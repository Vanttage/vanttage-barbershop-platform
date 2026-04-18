"use client";

import { motion } from "framer-motion";
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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.09, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HomeHero() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="relative overflow-hidden border-b border-white/[0.05]">

        {/* ── Fondo: luz dorada superior ─────────────────────────────── */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,_rgba(182,134,44,0.22),_transparent)]" />
        </motion.div>

        {/* ── Fondo: orbe ambiente inferior-derecho ──────────────────── */}
        <motion.div
          className="pointer-events-none absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(182,134,44,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Ruido sutil ────────────────────────────────────────────── */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />

        {/* ── Contenido ──────────────────────────────────────────────── */}
        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20 lg:flex-row lg:items-center lg:gap-16">

          {/* Left — copy */}
          <div className="max-w-2xl">
            <motion.p
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-gold"
            >
              SaaS para barberias
            </motion.p>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="font-display text-5xl font-semibold leading-tight text-zinc-50 md:text-6xl"
            >
              Gestiona agenda, equipo y clientes sin perder el estilo.
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-6 max-w-xl text-base leading-7 text-zinc-400"
            >
              VANTTAGE centraliza reservas, operacion diaria, pagos y fidelizacion
              en una sola plataforma lista para crecimiento multi-sede.
            </motion.p>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-8 flex flex-wrap gap-3"
            >
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
            </motion.div>
          </div>

          {/* Right — card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 lg:mt-0 lg:w-[30rem]"
          >
            {/* Floating glow behind card */}
            <motion.div
              className="pointer-events-none absolute -inset-6 rounded-[3rem]"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(182,134,44,0.09), transparent)",
                filter: "blur(24px)",
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative grid gap-4 rounded-[2rem] border border-white/[0.06] bg-[#111113]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
              {/* Stats */}
              <div className="rounded-2xl border border-white/[0.05] bg-zinc-900/70 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">Operacion del dia</span>
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-400"
                  >
                    En linea
                  </motion.span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {stats.map(([label, value], i) => (
                    <motion.div
                      key={label}
                      custom={i}
                      variants={fadeIn}
                      initial="hidden"
                      animate="show"
                      className="rounded-xl border border-white/[0.05] bg-zinc-950/70 p-3"
                    >
                      <p className="text-xs uppercase tracking-[0.14em] text-zinc-600">{label}</p>
                      <p className="mt-2 text-xl font-medium text-zinc-100">{value}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="rounded-2xl border border-white/[0.05] bg-zinc-900/70 p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-600">Incluye</p>
                <div className="mt-4 space-y-3">
                  {features.map((item, i) => (
                    <motion.div
                      key={item}
                      custom={i}
                      variants={fadeIn}
                      initial="hidden"
                      animate="show"
                      className="flex items-center gap-3"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.4,
                        }}
                        className="h-2 w-2 flex-shrink-0 rounded-full bg-gold"
                      />
                      <span className="text-sm text-zinc-300">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

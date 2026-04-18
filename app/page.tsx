import Link from "next/link";

const features = [
  "Agenda online por barbero y sede",
  "Pagos, historial y clientes frecuentes",
  "Dashboard operativo con metricas de negocio",
  "Automatizaciones por WhatsApp y correo",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="relative overflow-hidden border-b border-white/[0.05]">

        {/* Luz dorada superior — respira */}
        <div
          className="home-glow pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 45% at 50% -8%, rgba(182,134,44,0.22), transparent)",
          }}
        />

        {/* Orbe ambiente inferior-derecho */}
        <div
          className="home-orb pointer-events-none absolute -bottom-24 -right-24 h-[600px] w-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(182,134,44,0.07) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20 lg:flex-row lg:items-center lg:gap-16">

          {/* Left */}
          <div className="max-w-2xl">
            <p className="home-badge mb-4 text-xs font-medium uppercase tracking-[0.25em] text-gold">
              SaaS para barberias
            </p>
            <h1 className="home-h1 font-display text-5xl font-semibold leading-tight text-zinc-50 md:text-6xl">
              Gestiona agenda, equipo y clientes sin perder el estilo.
            </h1>
            <p className="home-p mt-6 max-w-xl text-base leading-7 text-zinc-400">
              VANTTAGE centraliza reservas, operacion diaria, pagos y fidelizacion
              en una sola plataforma lista para crecimiento multi-sede.
            </p>
            <div className="home-ctas mt-8 flex flex-wrap gap-3">
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
          <div className="home-card relative mt-12 lg:mt-0 lg:w-[30rem]">
            <div
              className="home-orb pointer-events-none absolute -inset-6 rounded-[3rem]"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(182,134,44,0.08), transparent)",
                filter: "blur(24px)",
              }}
            />
            <div className="relative grid gap-4 rounded-[2rem] border border-white/[0.06] bg-[#111113]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <div className="rounded-2xl border border-white/[0.05] bg-zinc-900/70 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">Operacion del dia</span>
                  <span className="home-online rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-400">
                    En linea
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    ["Citas", "24"],
                    ["Ingresos", "$1.2M"],
                    ["Clientes", "136"],
                    ["Asistencia", "92%"],
                  ].map(([label, value], i) => (
                    <div
                      key={label}
                      className={`home-stat-${i} rounded-xl border border-white/[0.05] bg-zinc-950/70 p-3`}
                    >
                      <p className="text-xs uppercase tracking-[0.14em] text-zinc-600">{label}</p>
                      <p className="mt-2 text-xl font-medium text-zinc-100">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-zinc-900/70 p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-600">Incluye</p>
                <div className="mt-4 space-y-3">
                  {[
                    "Agenda online por barbero y sede",
                    "Pagos, historial y clientes frecuentes",
                    "Dashboard operativo con metricas de negocio",
                    "Automatizaciones por WhatsApp y correo",
                  ].map((item, i) => (
                    <div key={item} className={`home-feat-${i} flex items-center gap-3`}>
                      <span className={`home-dot-${i} h-2 w-2 flex-shrink-0 rounded-full bg-gold`} />
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

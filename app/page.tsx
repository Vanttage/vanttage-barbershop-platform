import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0b0b0c] text-zinc-100">
      <section className="relative overflow-hidden">
        {/* Glow top */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(182,134,44,0.18), transparent)",
          }}
        />

        {/* subtle grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:40px_40px]" />

        <div className="relative mx-auto max-w-6xl px-6 py-12">
          {/* HERO CENTER */}
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-6 text-xs uppercase tracking-[0.2em] text-gold/70">
              Software para barberías
            </p>

            <h1 className="font-display text-5xl font-semibold leading-tight md:text-6xl">
              Tu barbería,
              <br />
              en control total.
            </h1>

            <p className="mt-6 text-base text-zinc-400">
              Agenda, clientes y pagos organizados en un solo lugar. Menos caos.
              Más ingresos.
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <Link
                href="/register"
                className="rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.04]"
              >
                Empezar gratis
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-white/[0.1] px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>

          {/* PRODUCT PREVIEW */}
          <div className="relative mx-auto mt-20 max-w-5xl">
            {/* glow behind */}
            <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-gold/5 blur-3xl" />

            <div className="relative rounded-[2rem] border border-white/[0.08] bg-[#111113]/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur">
              {/* top bar */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <p className="text-sm text-zinc-400">Hoy en la barbería</p>
                <span className="text-xs text-emerald-400">● Abierto</span>
              </div>

              {/* content */}
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* left: schedule */}
                <div className="space-y-3">
                  {[
                    ["10:00", "Juan", "Fade"],
                    ["10:30", "Luis", "Barba"],
                    ["11:00", "Carlos", "Corte"],
                    ["11:30", "Andrés", "Fade + Barba"],
                  ].map(([time, name, service]) => (
                    <div
                      key={time}
                      className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-zinc-950/70 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm text-zinc-200">
                          {time} · {name}
                        </p>
                        <p className="text-xs text-zinc-500">{service}</p>
                      </div>
                      <span className="text-xs text-emerald-400">
                        Confirmado
                      </span>
                    </div>
                  ))}
                </div>

                {/* right: stats */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Cortes hoy", "26"],
                    ["Ingresos", "$1.4M"],
                    ["Clientes", "19"],
                    ["Ocupación", "94%"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-white/[0.05] bg-zinc-950/70 p-4"
                    >
                      <p className="text-xs text-zinc-500">{label}</p>
                      <p className="mt-2 text-xl font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* bottom subtle */}
              <div className="mt-6 border-t border-white/[0.05] pt-4 text-xs text-zinc-500">
                Todo sincronizado en tiempo real
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

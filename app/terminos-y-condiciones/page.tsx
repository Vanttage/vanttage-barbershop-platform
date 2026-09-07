import Link from "next/link";

export const metadata = {
  title: "Términos y condiciones — NAVA",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Qué es NAVA",
    body: [
      "NAVA es un software de gestión para barberías: agenda, clientes, caja, pagos y recordatorios automáticos. Lo ofrece VANTTAGE Tech.",
      "Al crear una cuenta o usar el sistema, aceptas estos términos.",
    ],
  },
  {
    title: "2. Tu cuenta",
    body: [
      "Eres responsable de la información que registras y de mantener tu contraseña segura.",
      "No compartas tu acceso con personas ajenas a tu barbería.",
    ],
  },
  {
    title: "3. Uso permitido",
    body: [
      "NAVA es para administrar tu barbería: agendar citas, cobrar, y comunicarte con tus propios clientes.",
      "No está permitido usarlo para enviar spam, mensajes masivos no solicitados, ni actividades ilegales.",
    ],
  },
  {
    title: "4. Datos de tus clientes",
    body: [
      "Los datos de tus clientes (nombre, teléfono, historial de citas) son tuyos. NAVA los almacena y procesa solo para prestarte el servicio.",
      "Tú eres responsable de tener el consentimiento de tus clientes antes de enviarles recordatorios por Telegram, WhatsApp o correo.",
      "No vendemos ni compartimos tus datos ni los de tus clientes con terceros.",
    ],
  },
  {
    title: "5. Planes y pagos",
    body: [
      "NAVA tiene un plan gratuito y planes pagos con funciones adicionales (automatizaciones, reportes).",
      "Puedes cambiar o cancelar tu plan cuando quieras — no hay permanencia obligatoria.",
    ],
  },
  {
    title: "6. Disponibilidad del servicio",
    body: [
      "Hacemos lo posible para que NAVA esté siempre disponible, pero no garantizamos un funcionamiento sin interrupciones.",
      "Puede haber mantenimientos programados o fallas puntuales, especialmente en integraciones externas (Telegram, correo).",
    ],
  },
  {
    title: "7. Suspensión o cierre de cuenta",
    body: [
      "Puedes cerrar tu cuenta cuando quieras.",
      "Podemos suspender cuentas que incumplan estos términos (spam, uso fraudulento, actividad ilegal) o que lleven mucho tiempo sin pago en un plan pago.",
    ],
  },
  {
    title: "8. Cambios a estos términos",
    body: [
      "Podemos actualizar estos términos ocasionalmente. Si el cambio es importante, te avisamos por correo o dentro de la plataforma.",
    ],
  },
  {
    title: "9. Contacto",
    body: [
      "¿Dudas sobre estos términos? Escríbenos a soporte@vanttagetech.com.",
    ],
  },
];

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0c] text-zinc-100">
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(182,134,44,0.14), transparent)",
          }}
        />

        <div className="relative mx-auto max-w-2xl px-6 py-14 sm:py-20">
          {/* BRAND */}
          <div className="mb-10 text-center">
            <Link
              href="/"
              className="font-display text-2xl font-bold tracking-[0.16em] bg-[#D4AF37] bg-clip-text text-transparent sm:text-3xl"
            >
              NAVA
            </Link>
            <div className="mt-1.5 text-[10px] uppercase tracking-[0.24em] text-zinc-600">
              by VANTTAGE Tech
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">
              Términos y condiciones
            </h1>
            <p className="mt-3 text-sm text-zinc-500">
              Última actualización: 7 de septiembre de 2026
            </p>
          </div>

          <div className="space-y-4">
            {SECTIONS.map((section) => (
              <section
                key={section.title}
                className="rounded-2xl border border-white/[0.06] bg-[#111113]/80 p-5 sm:p-6"
              >
                <h2 className="font-display text-[15px] font-semibold text-gold-light">
                  {section.title}
                </h2>
                <div className="mt-2.5 space-y-2">
                  {section.body.map((line) => (
                    <p key={line} className="text-[13.5px] leading-relaxed text-zinc-400">
                      {line}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-zinc-600">
            <Link href="/politica-de-privacidad" className="text-gold/80 transition hover:text-gold-light">
              Ver política de privacidad
            </Link>
            {" · "}
            <Link href="/" className="text-gold/80 transition hover:text-gold-light">
              Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";

export const metadata = {
  title: "Política de privacidad — NAVA",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Qué datos recopilamos",
    body: [
      "De quien registra una barbería: nombre, correo, teléfono y contraseña (o tu cuenta de Google).",
      "De los clientes de tu barbería: nombre, teléfono y, opcionalmente, correo — los que ellos mismos dan al reservar una cita.",
      "Datos de uso del servicio: citas, pagos registrados, y si el cliente vinculó Telegram para recibir recordatorios.",
    ],
  },
  {
    title: "2. Para qué los usamos",
    body: [
      "Para operar el servicio: agendar citas, procesar pagos que registras, y enviar confirmaciones y recordatorios.",
      "Para las automatizaciones que actives: recordatorios por Telegram, solicitudes de reseña, reportes por correo.",
      "No usamos estos datos para publicidad ni los analizamos con fines distintos a hacer funcionar NAVA.",
    ],
  },
  {
    title: "3. Con quién los compartimos",
    body: [
      "Con proveedores que usamos para operar NAVA — Resend (envío de correos), Telegram (mensajería) y Supabase (base de datos) — solo en la medida necesaria para prestarte el servicio.",
      "Nunca vendemos ni compartimos tus datos ni los de tus clientes con terceros para fines comerciales.",
    ],
  },
  {
    title: "4. Cómo los protegemos",
    body: [
      "Las contraseñas se guardan cifradas, nunca en texto plano.",
      "Cada barbería solo puede ver y acceder a su propia información — no hay acceso cruzado entre negocios distintos dentro de NAVA.",
    ],
  },
  {
    title: "5. Tus derechos sobre tus datos",
    body: [
      "Como dueño de tu barbería, puedes pedirnos en cualquier momento acceder, corregir o eliminar tu información y la de tu negocio.",
      "Si eres cliente de una barbería que usa NAVA, puedes pedirle a esa barbería que corrija o elimine tus datos — ellos son quienes los recogieron y son responsables de esa relación contigo.",
      "Esto aplica los derechos de acceso, corrección y eliminación de datos personales reconocidos por la Ley 1581 de 2012 (Colombia).",
    ],
  },
  {
    title: "6. Cookies",
    body: [
      "Usamos solo las cookies necesarias para que la plataforma funcione: mantener tu sesión iniciada y recordar a qué barbería perteneces. No usamos cookies de rastreo publicitario.",
    ],
  },
  {
    title: "7. Menores de edad",
    body: [
      "NAVA no está dirigido a menores de edad. No recopilamos intencionalmente datos de menores de 18 años.",
    ],
  },
  {
    title: "8. Cambios a esta política",
    body: [
      "Podemos actualizar esta política ocasionalmente. Si el cambio es importante, te avisamos por correo o dentro de la plataforma.",
    ],
  },
  {
    title: "9. Contacto",
    body: [
      "¿Dudas sobre tus datos o esta política? Escríbenos a soporte@vanttagetech.com.",
    ],
  },
];

export default function PoliticaPrivacidadPage() {
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
              Política de privacidad
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
            <Link href="/terminos-y-condiciones" className="text-gold/80 transition hover:text-gold-light">
              Ver términos y condiciones
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

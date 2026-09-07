import Link from "next/link";

export const metadata = {
  title: "Política de privacidad — NAVA",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Responsable del tratamiento",
    body: [
      "VANTTAGE Tech, a través de la plataforma NAVA, es responsable del tratamiento de los datos personales que se describen en esta política.",
      "Contacto para temas de datos personales: soporte@vanttagetech.com.",
    ],
  },
  {
    title: "2. Qué datos recopilamos",
    body: [
      "De quien registra una barbería: nombre, correo, teléfono y contraseña (o tu cuenta de Google).",
      "De los clientes de tu barbería: nombre, teléfono y, opcionalmente, correo — los que ellos mismos dan al reservar una cita.",
      "Datos de uso del servicio: citas, pagos registrados, y si el cliente vinculó Telegram para recibir recordatorios.",
    ],
  },
  {
    title: "3. Para qué los usamos",
    body: [
      "Para operar el servicio: agendar citas, procesar pagos que registras, y enviar confirmaciones y recordatorios.",
      "Para las automatizaciones que actives: recordatorios por Telegram, solicitudes de reseña, reportes por correo.",
      "No usamos estos datos para publicidad ni los analizamos con fines distintos a hacer funcionar NAVA.",
    ],
  },
  {
    title: "4. Con quién los compartimos",
    body: [
      "Con proveedores que usamos para operar NAVA — Resend (envío de correos), Telegram (mensajería) y Supabase (base de datos) — solo en la medida necesaria para prestarte el servicio.",
      "Nunca vendemos ni compartimos tus datos ni los de tus clientes con terceros para fines comerciales.",
    ],
  },
  {
    title: "5. Cómo los protegemos",
    body: [
      "Las contraseñas se guardan cifradas, nunca en texto plano.",
      "Cada barbería solo puede ver y acceder a su propia información — no hay acceso cruzado entre negocios distintos dentro de NAVA.",
    ],
  },
  {
    title: "6. Tratamiento de datos personales (Habeas Data)",
    body: [
      "Como titular de tus datos personales, la Ley 1581 de 2012 (Colombia) te da derecho a: conocer, actualizar y rectificar tu información; solicitar prueba de la autorización que diste; ser informado sobre el uso que le hemos dado; revocar tu autorización y/o pedir que eliminemos tus datos cuando no exista un deber legal de conservarlos; y acceder gratuitamente a tus datos.",
      "Si eres dueño de una barbería, ejerces estos derechos directamente con nosotros (soporte@vanttagetech.com). Si eres cliente de una barbería que usa NAVA, el responsable directo de tus datos es esa barbería — puedes pedírselo a ella, o escribirnos y te ponemos en contacto.",
      "Si consideras que tus datos no se están tratando conforme a la ley, tienes derecho a presentar una queja ante la Superintendencia de Industria y Comercio (SIC), autoridad de protección de datos en Colombia.",
    ],
  },
  {
    title: "7. Cookies",
    body: [
      "Usamos solo las cookies necesarias para que la plataforma funcione: mantener tu sesión iniciada y recordar a qué barbería perteneces. No usamos cookies de rastreo publicitario.",
    ],
  },
  {
    title: "8. Menores de edad",
    body: [
      "NAVA no está dirigido a menores de edad. No recopilamos intencionalmente datos de menores de 18 años.",
    ],
  },
  {
    title: "9. Cambios a esta política",
    body: [
      "Podemos actualizar esta política ocasionalmente. Si el cambio es importante, te avisamos por correo o dentro de la plataforma.",
    ],
  },
  {
    title: "10. Contacto",
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

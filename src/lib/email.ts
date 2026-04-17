import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM    = process.env.RESEND_FROM    ?? "VANTTAGE <noreply@vanttage.app>";
const BASE_URL = process.env.NEXTAUTH_URL  ?? "http://localhost:3000";

// ── Password reset ────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Restablece tu contraseña — VANTTAGE",
      html: buildResetEmail({ name, resetUrl }),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

// ── Password changed confirmation ─────────────────────────────────────────────

export async function sendPasswordChangedEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Contraseña actualizada — VANTTAGE",
      html: buildChangedEmail({ name }),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

// ── Weekly report ─────────────────────────────────────────────────────────────

export async function sendWeeklyReportEmail({
  to,
  ownerName,
  barbershopName,
  weekLabel,
  totalCitas,
  totalIngresos,
  topClient,
}: {
  to: string;
  ownerName: string;
  barbershopName: string;
  weekLabel: string;
  totalCitas: number;
  totalIngresos: number;
  topClient?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Reporte semanal · ${barbershopName} — VANTTAGE`,
      html: buildWeeklyReportEmail({ ownerName, barbershopName, weekLabel, totalCitas, totalIngresos, topClient }),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

// ── HTML builders ─────────────────────────────────────────────────────────────

function shell(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Syne:wght@700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:#09090B;font-family:'Inter',Arial,sans-serif;color:#A1A1AA;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090B;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#111113;border-radius:20px;border:1px solid rgba(255,255,255,0.06);">
          <!-- Brand header -->
          <tr>
            <td style="background:linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.03));padding:28px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.05);border-radius:20px 20px 0 0;">
              <div style="font-family:'Syne',Georgia,sans-serif;font-size:20px;font-weight:700;letter-spacing:0.12em;color:#C9A84C;">VANTTAGE</div>
              <div style="font-size:10px;letter-spacing:0.18em;color:#52525B;margin-top:3px;text-transform:uppercase;">Sistema de barbería</div>
            </td>
          </tr>
          ${content}
          <!-- Footer -->
          <tr>
            <td style="padding:18px 36px 24px;border-top:1px solid rgba(255,255,255,0.04);">
              <p style="margin:0;font-size:11px;color:#3F3F46;line-height:1.6;">
                Este mensaje fue enviado automáticamente por VANTTAGE. No respondas a este correo.<br/>
                © ${new Date().getFullYear()} VANTTAGE · vanttage.app
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildResetEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  return shell(`
  <tr>
    <td style="padding:32px 36px 28px;">
      <p style="margin:0 0 6px;font-size:12px;color:#71717A;text-transform:uppercase;letter-spacing:0.12em;">Hola, ${escapeHtml(name)}</p>
      <h1 style="margin:0 0 16px;font-family:'Syne',Georgia,sans-serif;font-size:22px;font-weight:700;color:#F4F4F5;line-height:1.3;">
        Restablece tu contraseña
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#A1A1AA;line-height:1.7;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú, haz clic en el botón de abajo. Si no realizaste esta solicitud, ignora este mensaje.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;background:rgba(201,168,76,0.15);color:#D4A843;font-size:14px;font-weight:600;padding:14px 28px;border-radius:12px;text-decoration:none;border:1px solid rgba(201,168,76,0.35);letter-spacing:0.02em;">
        Restablecer contraseña →
      </a>
      <p style="margin:22px 0 4px;font-size:12px;color:#52525B;line-height:1.6;">
        El enlace expira en <strong style="color:#71717A;">1 hora</strong>. Si el botón no funciona, copia esta URL:
      </p>
      <p style="margin:0;font-size:11px;color:#3F3F46;word-break:break-all;">${resetUrl}</p>
    </td>
  </tr>`);
}

function buildChangedEmail({ name }: { name: string }) {
  return shell(`
  <tr>
    <td style="padding:32px 36px 28px;">
      <p style="margin:0 0 6px;font-size:12px;color:#71717A;text-transform:uppercase;letter-spacing:0.12em;">Hola, ${escapeHtml(name)}</p>
      <h1 style="margin:0 0 16px;font-family:'Syne',Georgia,sans-serif;font-size:22px;font-weight:700;color:#F4F4F5;line-height:1.3;">
        Contraseña actualizada
      </h1>
      <p style="margin:0 0 20px;font-size:14px;color:#A1A1AA;line-height:1.7;">
        Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales.
      </p>
      <div style="background:rgba(58,175,123,0.08);border:1px solid rgba(58,175,123,0.2);border-radius:12px;padding:14px 18px;">
        <p style="margin:0;font-size:13px;color:#3AAF7B;">
          ¿No fuiste tú? Contacta de inmediato a soporte en <a href="mailto:soporte@vanttage.app" style="color:#3AAF7B;">soporte@vanttage.app</a>
        </p>
      </div>
    </td>
  </tr>`);
}

function buildWeeklyReportEmail({
  ownerName,
  barbershopName,
  weekLabel,
  totalCitas,
  totalIngresos,
  topClient,
}: {
  ownerName: string;
  barbershopName: string;
  weekLabel: string;
  totalCitas: number;
  totalIngresos: number;
  topClient?: string;
}) {
  const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(totalIngresos);
  return shell(`
  <tr>
    <td style="padding:32px 36px 28px;">
      <p style="margin:0 0 6px;font-size:12px;color:#71717A;text-transform:uppercase;letter-spacing:0.12em;">Hola, ${escapeHtml(ownerName)}</p>
      <h1 style="margin:0 0 4px;font-family:'Syne',Georgia,sans-serif;font-size:22px;font-weight:700;color:#F4F4F5;">
        Reporte semanal
      </h1>
      <p style="margin:0 0 24px;font-size:13px;color:#71717A;">${escapeHtml(barbershopName)} · ${escapeHtml(weekLabel)}</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.04);">
            <div style="font-size:10px;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Total citas</div>
            <div style="font-size:24px;font-weight:600;color:#F4F4F5;">${totalCitas}</div>
          </td>
          <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.04);border-left:1px solid rgba(255,255,255,0.04);">
            <div style="font-size:10px;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Ingresos</div>
            <div style="font-size:24px;font-weight:600;color:#C9A84C;">${cop}</div>
          </td>
        </tr>
        ${topClient ? `
        <tr>
          <td colspan="2" style="padding:16px 20px;">
            <div style="font-size:10px;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Cliente más frecuente</div>
            <div style="font-size:15px;font-weight:500;color:#D4D4D8;">${escapeHtml(topClient)}</div>
          </td>
        </tr>` : ""}
      </table>
    </td>
  </tr>`);
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

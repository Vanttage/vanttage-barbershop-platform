/**
 * Registra el webhook del bot de Telegram contra esta app.
 * Correr UNA VEZ (o cada vez que cambie el dominio) después de configurar
 * TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET y NEXT_PUBLIC_APP_URL en .env.
 *
 * Uso:
 *   npm run telegram:setup
 */
async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token) throw new Error("Falta TELEGRAM_BOT_TOKEN en .env");
  if (!secret) throw new Error("Falta TELEGRAM_WEBHOOK_SECRET en .env");
  if (!appUrl) throw new Error("Falta NEXT_PUBLIC_APP_URL en .env");
  if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL apunta a localhost — Telegram necesita una URL pública HTTPS. " +
        "Corre esto contra la URL de producción.",
    );
  }

  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message"],
    }),
  });
  const json = await res.json();

  if (!json.ok) {
    throw new Error(`Telegram rechazó el webhook: ${json.description}`);
  }

  console.log(`✅ Webhook registrado: ${webhookUrl}`);

  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then((r) =>
    r.json(),
  );
  console.log("Estado actual:", JSON.stringify(info.result, null, 2));
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});

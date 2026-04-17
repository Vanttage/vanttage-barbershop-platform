# ─────────────────────────────────────────────────────────────────────────────
#  VANTTAGE · scripts/test-automations.ps1
#
#  Prueba todos los endpoints de automatización y notificaciones.
#  Ejecutar con: .\scripts\test-automations.ps1
#
#  Variables obligatorias antes de ejecutar:
#    $env:TEST_TO_PHONE  = "3001234567"   # tu celular (sin +57)
#    $env:TEST_TO_EMAIL  = "tu@email.com" # tu email
#    $env:BASE_URL       = "http://localhost:3000"  (default)
#    $env:CRON_SECRET    = "dev-cron-secret-cambia-en-produccion"  (default)
# ─────────────────────────────────────────────────────────────────────────────

param(
  [string]$Phone = $env:TEST_TO_PHONE,
  [string]$Email = $env:TEST_TO_EMAIL,
  [string]$Base  = ($env:BASE_URL   ?? "http://localhost:3000"),
  [string]$Secret = ($env:CRON_SECRET ?? "dev-cron-secret-cambia-en-produccion")
)

$headers = @{ Authorization = "Bearer $Secret" }

function Invoke-Test {
  param([string]$Label, [string]$Url)
  Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
  Write-Host "  $Label" -ForegroundColor Cyan
  Write-Host "  $Url" -ForegroundColor DarkGray
  try {
    $resp = Invoke-RestMethod -Uri $Url -Headers $headers -Method GET -ErrorAction Stop
    $json = $resp | ConvertTo-Json -Depth 6
    if ($resp.ok -eq $true) {
      Write-Host "  ✅ OK" -ForegroundColor Green
    } else {
      Write-Host "  ❌ FAILED" -ForegroundColor Red
    }
    Write-Host $json -ForegroundColor Gray
  } catch {
    Write-Host "  ⚠️  Error HTTP: $($_.Exception.Message)" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
      Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
    }
  }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║   VANTTAGE · Pruebas de automatización       ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host "  Base URL : $Base"
Write-Host "  Teléfono : $(if ($Phone) { $Phone } else { '⚠️  no configurado (usa -Phone 3001234567)' })"
Write-Host "  Email    : $(if ($Email) { $Email } else { '⚠️  no configurado (usa -Email tu@email.com)' })"

# ── 1. Estado del sistema ────────────────────────────────────────────────────

Invoke-Test "Estado del sistema" "$Base/api/test/run-job"

# ── 2. WhatsApp — mensaje simple ─────────────────────────────────────────────

if ($Phone) {
  Invoke-Test "WhatsApp · mensaje simple"        "$Base/api/test/whatsapp?to=$Phone&type=simple"
  Invoke-Test "WhatsApp · confirmación de cita"  "$Base/api/test/whatsapp?to=$Phone&type=confirmation"
  Invoke-Test "WhatsApp · recordatorio 24h"      "$Base/api/test/whatsapp?to=$Phone&type=reminder24h"
  Invoke-Test "WhatsApp · recordatorio 1h"       "$Base/api/test/whatsapp?to=$Phone&type=reminder1h"
  Invoke-Test "WhatsApp · solicitud de reseña"   "$Base/api/test/whatsapp?to=$Phone&type=review"
  Invoke-Test "WhatsApp · reactivación"          "$Base/api/test/whatsapp?to=$Phone&type=reactivation"
} else {
  Write-Host "`n  ⚠️  Omitiendo pruebas WhatsApp — pasa -Phone 3001234567" -ForegroundColor Yellow
}

# ── 3. Email ─────────────────────────────────────────────────────────────────

if ($Email) {
  Invoke-Test "Email · recuperación de contraseña" "$Base/api/test/email?to=$Email&type=reset"
  Invoke-Test "Email · contraseña cambiada"        "$Base/api/test/email?to=$Email&type=changed"
  Invoke-Test "Email · reporte semanal"            "$Base/api/test/email?to=$Email&type=weekly"
} else {
  Write-Host "`n  ⚠️  Omitiendo pruebas Email — pasa -Email tu@email.com" -ForegroundColor Yellow
}

# ── 4. Cron jobs (dry run — solo procesa tenants reales de la DB) ─────────────

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  ⚠️  Los siguientes jobs usan la base de datos real." -ForegroundColor Yellow
Write-Host "     Solo se procesarán tenants con los toggles activos." -ForegroundColor Yellow
$confirm = Read-Host "`n  ¿Ejecutar cron jobs? (s/N)"

if ($confirm -match "^[sS]") {
  Invoke-Test "Cron · reminders"       "$Base/api/test/run-job?job=reminders"
  Invoke-Test "Cron · reactivation"    "$Base/api/test/run-job?job=reactivation"
  Invoke-Test "Cron · weekly-report"   "$Base/api/test/run-job?job=weekly-report"
} else {
  Write-Host "  Cron jobs omitidos." -ForegroundColor DarkGray
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  ✅ Pruebas completadas." -ForegroundColor Green
Write-Host ""

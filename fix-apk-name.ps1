# Script para corregir el nombre del APK después del build
$sourceApk = "android\app\build\outputs\apk\debug\ControlAudit-debug.apk"
$targetApk = "android\app\build\outputs\apk\debug\app-debug.apk"

if (Test-Path $sourceApk) {
    Copy-Item $sourceApk $targetApk -Force
    Write-Host "✅ APK copiado: ControlAudit-debug.apk → app-debug.apk" -ForegroundColor Green
} else {
    Write-Host "❌ APK no encontrado: $sourceApk" -ForegroundColor Red
}



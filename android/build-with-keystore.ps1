# Script de PowerShell para build con keystore automático
# Uso: .\build-with-keystore.ps1

Write-Host "Iniciando build de Android con keystore automático..." -ForegroundColor Green

# Verificar si existe el keystore de debug
$debugKeystorePath = "$env:USERPROFILE\.android\debug.keystore"
$androidDir = "$env:USERPROFILE\.android"

Write-Host "Verificando keystore de debug..." -ForegroundColor Yellow

# Crear directorio .android si no existe
if (-not (Test-Path $androidDir)) {
    Write-Host "Creando directorio $androidDir" -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $androidDir -Force | Out-Null
}

# Verificar si el keystore de debug existe
if (-not (Test-Path $debugKeystorePath)) {
    Write-Host "Generando keystore de debug..." -ForegroundColor Yellow
    
    # Generar el keystore de debug con los parámetros estándar de Android
    $keytoolArgs = @(
        "-genkey", "-v",
        "-keystore", $debugKeystorePath,
        "-storepass", "android",
        "-alias", "androiddebugkey",
        "-keypass", "android",
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-dname", "CN=Android Debug,O=Android,C=US",
        "-noprompt"
    )
    
    try {
        & keytool @keytoolArgs
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Keystore de debug generado exitosamente en $debugKeystorePath" -ForegroundColor Green
        } else {
            Write-Host "Error al generar el keystore de debug" -ForegroundColor Red
            Write-Host "Asegurate de tener Java JDK instalado y configurado" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "Error al ejecutar keytool: $_" -ForegroundColor Red
        Write-Host "Verifica que Java JDK este instalado y en el PATH" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Keystore de debug ya existe en $debugKeystorePath" -ForegroundColor Green
}

Write-Host "Iniciando build de Android..." -ForegroundColor Yellow

# Ejecutar el build de Android
try {
    & .\gradlew.bat assembleDebug
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build completado exitosamente" -ForegroundColor Green
        Write-Host "APK generado en: app\build\outputs\apk\debug\ControlAudit-debug.apk" -ForegroundColor Cyan
        
        # Verificar que el APK existe
        $apkPath = "app\build\outputs\apk\debug\ControlAudit-debug.apk"
        if (Test-Path $apkPath) {
            $apkSize = (Get-Item $apkPath).Length
            $apkSizeMB = [math]::Round($apkSize / 1MB, 2)
            Write-Host "Tamaño del APK: $apkSizeMB MB" -ForegroundColor Cyan
        }
    } else {
        Write-Host "Error en el build de Android" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error al ejecutar gradlew: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Proceso completado exitosamente!" -ForegroundColor Green

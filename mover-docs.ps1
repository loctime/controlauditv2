# Script simple para mover documentación
# Ejecutar desde la raíz del proyecto: .\mover-docs.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ORGANIZANDO DOCUMENTACIÓN" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Crear carpetas
$carpetas = @("docs\guias", "docs\integraciones", "docs\arquitectura", "docs\implementaciones", "docs\guias-usuario", "docs\archivos-historicos")
foreach ($carpeta in $carpetas) {
    if (-not (Test-Path $carpeta)) {
        New-Item -ItemType Directory -Path $carpeta -Force | Out-Null
        Write-Host "✓ Carpeta creada: $carpeta" -ForegroundColor Green
    }
}

Write-Host "`nMoviendo archivos...`n" -ForegroundColor Yellow

# Mapeo de archivos
$archivos = @{
    "CONFIGURAR_FIRESTORE.md" = "docs\guias"
    "CAPACITOR_SETUP.md" = "docs\guias"
    "COMANDOS_NPM.md" = "docs\guias"
    "GUIA_DESPLIEGUE_VERCEL.md" = "docs\guias"
    "CONTROLFILE_INTEGRATION.md" = "docs\integraciones"
    "CONTROLFILE_SETUP.md" = "docs\integraciones"
    "ARQUITECTURA_HIBRIDA.md" = "docs\arquitectura"
    "FIRESTORE_STRUCTURE.md" = "docs\arquitectura"
    "INDICES_FIRESTORE.md" = "docs\arquitectura"
    "README_COMPONENTES_REUTILIZABLES.md" = "docs\arquitectura"
    "IMPLEMENTACION_OFFLINE_FINAL.md" = "docs\implementaciones"
    "PWA_OFFLINE_SOLUCION_FINAL.md" = "docs\implementaciones"
    "MEJORES_PRACTICAS_PWA_OFFLINE.md" = "docs\implementaciones"
    "GUIA_USUARIO_SISTEMA.md" = "docs\guias-usuario"
    "INSTRUCCIONES_PRUEBA.md" = "docs\guias-usuario"
    "SESION_REFACTOR_COMPLETA.md" = "docs\archivos-historicos"
    "RESUMEN_IMPLEMENTACION.md" = "docs\archivos-historicos"
    "RESUMEN_CAMBIOS_PWA.md" = "docs\archivos-historicos"
    "TABLA_SUCURSALES_NUEVA.md" = "docs\archivos-historicos"
}

$movidos = 0
$errores = 0

foreach ($archivo in $archivos.Keys) {
    $origen = $archivo
    $destino = Join-Path $archivos[$archivo] $archivo
    
    if (Test-Path $origen) {
        try {
            if (Test-Path $destino) {
                Write-Host "⚠ Ya existe: $archivo" -ForegroundColor Yellow
            } else {
                Copy-Item $origen $destino -Force
                Remove-Item $origen -Force
                Write-Host "✓ $archivo -> $($archivos[$archivo])" -ForegroundColor Green
                $movidos++
            }
        } catch {
            Write-Host "✗ Error: $archivo - $_" -ForegroundColor Red
            $errores++
        }
    } else {
        Write-Host "⚠ No encontrado: $archivo" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Movidos: $movidos" -ForegroundColor Green
Write-Host "Errores: $errores" -ForegroundColor $(if ($errores -eq 0) { "Green" } else { "Red" })
Write-Host "`n¡Listo!`n" -ForegroundColor Cyan

# ============================================
# Script para Organizar Documentación
# ControlAudit v2
# ============================================

Write-Host "`n📁 Organizando Documentación de ControlAudit v2..." -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$basePath = Get-Location
$errors = @()
$moved = 0
$skipped = 0

# Crear todas las carpetas necesarias
Write-Host "📂 Creando carpetas..." -ForegroundColor Yellow
$folders = @(
    "docs\guias",
    "docs\integraciones",
    "docs\arquitectura",
    "docs\implementaciones",
    "docs\guias-usuario",
    "docs\archivos-historicos"
)

foreach ($folder in $folders) {
    $fullPath = Join-Path $basePath $folder
    if (-not (Test-Path $fullPath)) {
        try {
            New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
            Write-Host "   ✅ Creada: $folder" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Error creando $folder : $_" -ForegroundColor Red
            $errors += "Error creando carpeta: $folder"
        }
    } else {
        Write-Host "   ✓ Ya existe: $folder" -ForegroundColor Gray
    }
}

Write-Host "`n📦 Moviendo archivos..." -ForegroundColor Yellow

# Mapeo completo de archivos a carpetas
$fileMappings = @(
    # Guías
    @{File="CONFIGURAR_FIRESTORE.md"; Dest="docs\guias"; Category="Guía"},
    @{File="CAPACITOR_SETUP.md"; Dest="docs\guias"; Category="Guía"},
    @{File="COMANDOS_NPM.md"; Dest="docs\guias"; Category="Guía"},
    @{File="GUIA_DESPLIEGUE_VERCEL.md"; Dest="docs\guias"; Category="Guía"},
    
    # Integraciones
    @{File="CONTROLFILE_INTEGRATION.md"; Dest="docs\integraciones"; Category="Integración"},
    @{File="CONTROLFILE_SETUP.md"; Dest="docs\integraciones"; Category="Integración"},
    
    # Arquitectura
    @{File="ARQUITECTURA_HIBRIDA.md"; Dest="docs\arquitectura"; Category="Arquitectura"},
    @{File="FIRESTORE_STRUCTURE.md"; Dest="docs\arquitectura"; Category="Arquitectura"},
    @{File="INDICES_FIRESTORE.md"; Dest="docs\arquitectura"; Category="Arquitectura"},
    @{File="README_COMPONENTES_REUTILIZABLES.md"; Dest="docs\arquitectura"; Category="Arquitectura"},
    
    # Implementaciones
    @{File="IMPLEMENTACION_OFFLINE_FINAL.md"; Dest="docs\implementaciones"; Category="Implementación"},
    @{File="PWA_OFFLINE_SOLUCION_FINAL.md"; Dest="docs\implementaciones"; Category="Implementación"},
    @{File="MEJORES_PRACTICAS_PWA_OFFLINE.md"; Dest="docs\implementaciones"; Category="Implementación"},
    
    # Guías de Usuario
    @{File="GUIA_USUARIO_SISTEMA.md"; Dest="docs\guias-usuario"; Category="Guía Usuario"},
    @{File="INSTRUCCIONES_PRUEBA.md"; Dest="docs\guias-usuario"; Category="Guía Usuario"},
    
    # Archivos Históricos
    @{File="SESION_REFACTOR_COMPLETA.md"; Dest="docs\archivos-historicos"; Category="Histórico"},
    @{File="RESUMEN_IMPLEMENTACION.md"; Dest="docs\archivos-historicos"; Category="Histórico"},
    @{File="RESUMEN_CAMBIOS_PWA.md"; Dest="docs\archivos-historicos"; Category="Histórico"},
    @{File="TABLA_SUCURSALES_NUEVA.md"; Dest="docs\archivos-historicos"; Category="Histórico"}
)

# Archivos que NO deben moverse (permanecen en raíz)
$keepInRoot = @("README.md", "DOCUMENTACION_CONSOLIDADA.md")

foreach ($mapping in $fileMappings) {
    $sourcePath = Join-Path $basePath $mapping.File
    $destFolder = Join-Path $basePath $mapping.Dest
    $destFile = Join-Path $destFolder $mapping.File
    
    if (Test-Path $sourcePath) {
        # Verificar si ya existe en destino
        if (Test-Path $destFile) {
            Write-Host "   ⚠️  Ya existe en destino: $($mapping.File)" -ForegroundColor Yellow
            $skipped++
            continue
        }
        
        try {
            Move-Item -Path $sourcePath -Destination $destFolder -Force -ErrorAction Stop
            Write-Host "   ✅ [$($mapping.Category)] $($mapping.File) -> $($mapping.Dest)" -ForegroundColor Green
            $moved++
        } catch {
            $errorMsg = "Error moviendo $($mapping.File): $_"
            Write-Host "   ❌ $errorMsg" -ForegroundColor Red
            $errors += $errorMsg
        }
    } else {
        Write-Host "   ⚠️  No encontrado: $($mapping.File)" -ForegroundColor Yellow
        $skipped++
    }
}

# Verificar archivos que deberían quedarse en raíz
Write-Host "`n🔍 Verificando archivos en raíz..." -ForegroundColor Yellow
$rootFiles = Get-ChildItem -Path $basePath -Filter "*.md" -File | Where-Object { $_.Name -notin $keepInRoot }

if ($rootFiles.Count -gt 0) {
    Write-Host "   ⚠️  Archivos .md encontrados en raíz (no deberían estar aquí):" -ForegroundColor Yellow
    foreach ($file in $rootFiles) {
        Write-Host "      - $($file.Name)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✅ Solo archivos permitidos en raíz (README.md y DOCUMENTACION_CONSOLIDADA.md)" -ForegroundColor Green
}

# Resumen final
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "📊 RESUMEN" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   ✅ Archivos movidos: $moved" -ForegroundColor Green
Write-Host "   ⚠️  Archivos omitidos: $skipped" -ForegroundColor Yellow
Write-Host "   ❌ Errores: $($errors.Count)" -ForegroundColor $(if ($errors.Count -eq 0) { "Green" } else { "Red" })

if ($errors.Count -gt 0) {
    Write-Host "`n❌ Errores encontrados:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   - $error" -ForegroundColor Red
    }
}

Write-Host "`n✨ Organización completada!" -ForegroundColor Cyan
Write-Host "`n📚 Estructura final:" -ForegroundColor Cyan
Write-Host "   docs/" -ForegroundColor Gray
Write-Host "   ├── guias/" -ForegroundColor Gray
Write-Host "   ├── integraciones/" -ForegroundColor Gray
Write-Host "   ├── arquitectura/" -ForegroundColor Gray
Write-Host "   ├── implementaciones/" -ForegroundColor Gray
Write-Host "   ├── guias-usuario/" -ForegroundColor Gray
Write-Host "   └── archivos-historicos/" -ForegroundColor Gray
Write-Host "`n"


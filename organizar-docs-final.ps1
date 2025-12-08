# ============================================
# Script Final para Organizar Documentación
# ControlAudit v2
# ============================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📁 ORGANIZANDO DOCUMENTACIÓN" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$basePath = Get-Location
$movedCount = 0
$errorCount = 0

# Función para mover archivo
function Move-DocFile {
    param(
        [string]$FileName,
        [string]$DestinationFolder,
        [string]$Category
    )
    
    $sourcePath = Join-Path $basePath $FileName
    $destPath = Join-Path $basePath $DestinationFolder
    $destFile = Join-Path $destPath $FileName
    
    if (-not (Test-Path $sourcePath)) {
        Write-Host "   ⚠️  No encontrado: $FileName" -ForegroundColor Yellow
        return $false
    }
    
    if (Test-Path $destFile) {
        Write-Host "   ⚠️  Ya existe en destino: $FileName" -ForegroundColor Yellow
        return $false
    }
    
    try {
        # Asegurar que la carpeta destino existe
        if (-not (Test-Path $destPath)) {
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        }
        
        # Copiar y luego eliminar (más seguro)
        Copy-Item -Path $sourcePath -Destination $destFile -Force
        Remove-Item -Path $sourcePath -Force
        
        Write-Host "   ✅ [$Category] $FileName -> $DestinationFolder" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "   ❌ Error: $FileName - $_" -ForegroundColor Red
        return $false
    }
}

# Crear carpetas
Write-Host "📂 Creando carpetas..." -ForegroundColor Yellow
$folders = @("docs\guias", "docs\integraciones", "docs\arquitectura", "docs\implementaciones", "docs\guias-usuario", "docs\archivos-historicos")
foreach ($folder in $folders) {
    $fullPath = Join-Path $basePath $folder
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "   ✅ Creada: $folder" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📦 Moviendo archivos..." -ForegroundColor Yellow
Write-Host ""

# Guías
Write-Host "   [GUIAS]" -ForegroundColor Cyan
if (Move-DocFile "CONFIGURAR_FIRESTORE.md" "docs\guias" "Guía") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "CAPACITOR_SETUP.md" "docs\guias" "Guía") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "COMANDOS_NPM.md" "docs\guias" "Guía") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "GUIA_DESPLIEGUE_VERCEL.md" "docs\guias" "Guía") { $movedCount++ } else { $errorCount++ }

# Integraciones
Write-Host "   [INTEGRACIONES]" -ForegroundColor Cyan
if (Move-DocFile "CONTROLFILE_INTEGRATION.md" "docs\integraciones" "Integración") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "CONTROLFILE_SETUP.md" "docs\integraciones" "Integración") { $movedCount++ } else { $errorCount++ }

# Arquitectura
Write-Host "   [ARQUITECTURA]" -ForegroundColor Cyan
if (Move-DocFile "ARQUITECTURA_HIBRIDA.md" "docs\arquitectura" "Arquitectura") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "FIRESTORE_STRUCTURE.md" "docs\arquitectura" "Arquitectura") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "INDICES_FIRESTORE.md" "docs\arquitectura" "Arquitectura") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "README_COMPONENTES_REUTILIZABLES.md" "docs\arquitectura" "Arquitectura") { $movedCount++ } else { $errorCount++ }

# Implementaciones
Write-Host "   [IMPLEMENTACIONES]" -ForegroundColor Cyan
if (Move-DocFile "IMPLEMENTACION_OFFLINE_FINAL.md" "docs\implementaciones" "Implementación") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "PWA_OFFLINE_SOLUCION_FINAL.md" "docs\implementaciones" "Implementación") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "MEJORES_PRACTICAS_PWA_OFFLINE.md" "docs\implementaciones" "Implementación") { $movedCount++ } else { $errorCount++ }

# Guías Usuario
Write-Host "   [GUIAS USUARIO]" -ForegroundColor Cyan
if (Move-DocFile "GUIA_USUARIO_SISTEMA.md" "docs\guias-usuario" "Guía Usuario") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "INSTRUCCIONES_PRUEBA.md" "docs\guias-usuario" "Guía Usuario") { $movedCount++ } else { $errorCount++ }

# Históricos
Write-Host "   [HISTÓRICOS]" -ForegroundColor Cyan
if (Move-DocFile "SESION_REFACTOR_COMPLETA.md" "docs\archivos-historicos" "Histórico") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "RESUMEN_IMPLEMENTACION.md" "docs\archivos-historicos" "Histórico") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "RESUMEN_CAMBIOS_PWA.md" "docs\archivos-historicos" "Histórico") { $movedCount++ } else { $errorCount++ }
if (Move-DocFile "TABLA_SUCURSALES_NUEVA.md" "docs\archivos-historicos" "Histórico") { $movedCount++ } else { $errorCount++ }

# Verificar archivos restantes en raíz
Write-Host ""
Write-Host "🔍 Verificando archivos en raíz..." -ForegroundColor Yellow
$rootFiles = Get-ChildItem -Path $basePath -Filter "*.md" -File | Where-Object { $_.Name -notin @("README.md", "DOCUMENTACION_CONSOLIDADA.md") }

if ($rootFiles.Count -eq 0) {
    Write-Host "   ✅ Solo archivos permitidos en raíz" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Archivos .md aún en raíz:" -ForegroundColor Yellow
    foreach ($file in $rootFiles) {
        Write-Host "      - $($file.Name)" -ForegroundColor Yellow
    }
}

# Resumen
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 RESUMEN FINAL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   ✅ Archivos movidos: $movedCount" -ForegroundColor Green
Write-Host "   ⚠️  Archivos no procesados: $errorCount" -ForegroundColor Yellow
Write-Host ""
Write-Host "✨ Organización completada!" -ForegroundColor Cyan
Write-Host ""

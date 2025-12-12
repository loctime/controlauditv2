# Script para mover todos los archivos de documentación a sus carpetas
$basePath = Get-Location

# Asegurar que las carpetas existen
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
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "✅ Creada: $folder"
    }
}

# Mapeo completo de archivos
$mappings = @(
    @{File="CONFIGURAR_FIRESTORE.md"; Dest="docs\guias"},
    @{File="CAPACITOR_SETUP.md"; Dest="docs\guias"},
    @{File="COMANDOS_NPM.md"; Dest="docs\guias"},
    @{File="GUIA_DESPLIEGUE_VERCEL.md"; Dest="docs\guias"},
    @{File="CONTROLFILE_INTEGRATION.md"; Dest="docs\integraciones"},
    @{File="CONTROLFILE_SETUP.md"; Dest="docs\integraciones"},
    @{File="ARQUITECTURA_HIBRIDA.md"; Dest="docs\arquitectura"},
    @{File="FIRESTORE_STRUCTURE.md"; Dest="docs\arquitectura"},
    @{File="INDICES_FIRESTORE.md"; Dest="docs\arquitectura"},
    @{File="README_COMPONENTES_REUTILIZABLES.md"; Dest="docs\arquitectura"},
    @{File="IMPLEMENTACION_OFFLINE_FINAL.md"; Dest="docs\implementaciones"},
    @{File="PWA_OFFLINE_SOLUCION_FINAL.md"; Dest="docs\implementaciones"},
    @{File="MEJORES_PRACTICAS_PWA_OFFLINE.md"; Dest="docs\implementaciones"},
    @{File="GUIA_USUARIO_SISTEMA.md"; Dest="docs\guias-usuario"},
    @{File="INSTRUCCIONES_PRUEBA.md"; Dest="docs\guias-usuario"},
    @{File="SESION_REFACTOR_COMPLETA.md"; Dest="docs\archivos-historicos"},
    @{File="RESUMEN_IMPLEMENTACION.md"; Dest="docs\archivos-historicos"},
    @{File="RESUMEN_CAMBIOS_PWA.md"; Dest="docs\archivos-historicos"},
    @{File="TABLA_SUCURSALES_NUEVA.md"; Dest="docs\archivos-historicos"}
)

$moved = 0
$notFound = 0

foreach ($mapping in $mappings) {
    $sourcePath = Join-Path $basePath $mapping.File
    $destFolder = Join-Path $basePath $mapping.Dest
    
    if (Test-Path $sourcePath) {
        try {
            Move-Item -Path $sourcePath -Destination $destFolder -Force -ErrorAction Stop
            Write-Host "✅ Movido: $($mapping.File) -> $($mapping.Dest)"
            $moved++
        } catch {
            Write-Host "❌ Error moviendo $($mapping.File): $_" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  No encontrado: $($mapping.File)" -ForegroundColor Yellow
        $notFound++
    }
}

Write-Host "`n📊 Resumen:"
Write-Host "   ✅ Movidos: $moved"
Write-Host "   ⚠️  No encontrados: $notFound"
Write-Host "`n✨ Organización completada!"


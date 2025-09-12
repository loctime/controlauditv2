# Script para configurar Java 21 permanentemente
Write-Host "Configurando Java 21..." -ForegroundColor Green

# Configurar JAVA_HOME para Java 21
$java21Path = "C:\Program Files\Java\jdk-21"
if (Test-Path $java21Path) {
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $java21Path, "User")
    Write-Host "✅ JAVA_HOME configurado: $java21Path" -ForegroundColor Green
    
    # Agregar Java 21 al PATH del usuario
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    $java21Bin = "$java21Path\bin"
    
    if ($currentPath -notlike "*$java21Bin*") {
        $newPath = "$java21Bin;$currentPath"
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
        Write-Host "✅ PATH actualizado con Java 21" -ForegroundColor Green
    } else {
        Write-Host "✅ Java 21 ya está en el PATH" -ForegroundColor Green
    }
    
    Write-Host "`nReinicia la terminal para aplicar los cambios." -ForegroundColor Yellow
    Write-Host "Luego ejecuta: java -version" -ForegroundColor Yellow
} else {
    Write-Host "❌ Java 21 no encontrado en: $java21Path" -ForegroundColor Red
}



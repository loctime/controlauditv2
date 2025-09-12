# Script para corregir automáticamente la versión Java en capacitor.build.gradle
$filePath = "app\capacitor.build.gradle"

if (Test-Path $filePath) {
    $content = Get-Content $filePath -Raw
    
    # Reemplazar Java 21 con Java 17
    $fixedContent = $content -replace "sourceCompatibility JavaVersion\.VERSION_21", "sourceCompatibility JavaVersion.VERSION_17"
    $fixedContent = $fixedContent -replace "targetCompatibility JavaVersion\.VERSION_21", "targetCompatibility JavaVersion.VERSION_17"
    
    if ($content -ne $fixedContent) {
        Set-Content $filePath $fixedContent
        Write-Host "✅ Java version fixed: 21 → 17" -ForegroundColor Green
    } else {
        Write-Host "✅ Java version already correct (17)" -ForegroundColor Green
    }
} else {
    Write-Host "❌ File not found: $filePath" -ForegroundColor Red
}

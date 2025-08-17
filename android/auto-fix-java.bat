@echo off
echo 🔧 Corrigiendo versión de Java...

REM Reemplazar Java 21 con Java 17 en capacitor.build.gradle
powershell -Command "(Get-Content 'app\capacitor.build.gradle') -replace 'JavaVersion\.VERSION_21', 'JavaVersion.VERSION_17' | Set-Content 'app\capacitor.build.gradle'"

echo ✅ Versión de Java corregida a 17

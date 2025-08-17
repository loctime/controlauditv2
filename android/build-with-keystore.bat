@echo off
REM Script de build que incluye la generación automática del keystore de debug

echo 🚀 Iniciando build de Android con keystore automático...

REM Primero generar el keystore de debug si no existe
echo 🔧 Verificando keystore de debug...
call generate-debug-keystore.bat

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error al generar el keystore de debug
    echo 💡 Intenta ejecutar: .\generate-debug-keystore.bat
    exit /b 1
)

echo 🔨 Iniciando build de Android...

REM Ejecutar el build de Android
call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build completado exitosamente
    echo 📱 APK generado en: app\build\outputs\apk\debug\app-debug.apk
) else (
    echo ❌ Error en el build de Android
    exit /b 1
)

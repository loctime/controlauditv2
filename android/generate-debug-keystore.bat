@echo off
REM Script para generar el keystore de debug si no existe
REM Esto es necesario para builds en CI/CD donde no existe el keystore por defecto

set DEBUG_KEYSTORE_PATH=%USERPROFILE%\.android\debug.keystore
set ANDROID_DIR=%USERPROFILE%\.android

echo 🔧 Verificando keystore de debug...

REM Crear directorio .android si no existe
if not exist "%ANDROID_DIR%" (
    echo 📁 Creando directorio %ANDROID_DIR%
    mkdir "%ANDROID_DIR%"
)

REM Verificar si el keystore de debug existe
if not exist "%DEBUG_KEYSTORE_PATH%" (
    echo 🔑 Generando keystore de debug...
    
    REM Generar el keystore de debug con los parámetros estándar de Android
    keytool -genkey -v ^
        -keystore "%DEBUG_KEYSTORE_PATH%" ^
        -storepass android ^
        -alias androiddebugkey ^
        -keypass android ^
        -keyalg RSA ^
        -keysize 2048 ^
        -validity 10000 ^
        -dname "CN=Android Debug,O=Android,C=US" ^
        -noprompt
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Keystore de debug generado exitosamente en %DEBUG_KEYSTORE_PATH%
    ) else (
        echo ❌ Error al generar el keystore de debug
        exit /b 1
    )
) else (
    echo ✅ Keystore de debug ya existe en %DEBUG_KEYSTORE_PATH%
)

echo 🔧 Configuración de keystore completada

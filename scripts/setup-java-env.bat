@echo off
echo ========================================
echo    CONFIGURACION DE JAVA PARA ANDROID
echo ========================================
echo.

echo 🔍 Verificando Java actual...
java -version 2>nul
if %errorlevel% neq 0 (
    echo ❌ Java no encontrado en PATH
) else (
    echo ✅ Java encontrado
)
echo.

echo 📋 CONFIGURACION DE VARIABLES DE ENTORNO
echo ========================================

echo.
echo 🎯 PASOS A SEGUIR:
echo.
echo 1️⃣ Abre el Panel de Control de Windows
echo 2️⃣ Sistema y Seguridad > Sistema
echo 3️⃣ Configuración avanzada del sistema
echo 4️⃣ Variables de entorno
echo.
echo 📝 VARIABLES A CONFIGURAR:
echo.
echo 🔹 JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot
echo    (Ajusta la ruta según donde instalaste JDK 17)
echo.
echo 🔹 PATH = Agregar %JAVA_HOME%\bin
echo.
echo ⚠️  NOTAS IMPORTANTES:
echo    • Asegúrate de que JAVA_HOME apunte a la carpeta del JDK (no bin)
echo    • Reinicia la terminal después de configurar las variables
echo    • Verifica con: java -version
echo.

echo 🔗 ENLACES UTILES:
echo    • Eclipse Temurin: https://adoptium.net/temurin/releases/?version=17
echo    • Oracle JDK: https://www.oracle.com/java/technologies/downloads/#java17
echo.

echo ✅ DESPUES DE CONFIGURAR:
echo    1. Reinicia la terminal
echo    2. Ejecuta: java -version
echo    3. Debería mostrar Java 17
echo    4. Luego ejecuta: npm run android:dev
echo.

pause

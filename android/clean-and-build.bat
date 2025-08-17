@echo off
echo 🧹 Limpiando proyecto Android...
gradlew.bat clean

echo 🔧 Sincronizando Gradle...
gradlew.bat --refresh-dependencies

echo 📱 Construyendo proyecto...
gradlew.bat assembleDebug

echo ✅ Proceso completado!
pause

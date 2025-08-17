#!/bin/bash

# Script de build que incluye la generación automática del keystore de debug

echo "🚀 Iniciando build de Android con keystore automático..."

# Primero generar el keystore de debug si no existe
echo "🔧 Verificando keystore de debug..."
./generate-debug-keystore.sh

if [ $? -ne 0 ]; then
    echo "❌ Error al generar el keystore de debug"
    exit 1
fi

echo "🔨 Iniciando build de Android..."

# Ejecutar el build de Android
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo "✅ Build completado exitosamente"
    echo "📱 APK generado en: app/build/outputs/apk/debug/app-debug.apk"
else
    echo "❌ Error en el build de Android"
    exit 1
fi

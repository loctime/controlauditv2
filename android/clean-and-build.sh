#!/bin/bash

echo "🧹 Limpiando proyecto Android..."
./gradlew clean

echo "🔧 Sincronizando Gradle..."
./gradlew --refresh-dependencies

echo "📱 Construyendo proyecto..."
./gradlew assembleDebug

echo "✅ Proceso completado!"

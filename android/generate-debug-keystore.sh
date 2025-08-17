#!/bin/bash

# Script para generar el keystore de debug si no existe
# Esto es necesario para builds en CI/CD donde no existe el keystore por defecto

DEBUG_KEYSTORE_PATH="$HOME/.android/debug.keystore"
ANDROID_DIR="$HOME/.android"

echo "🔧 Verificando keystore de debug..."

# Crear directorio .android si no existe
if [ ! -d "$ANDROID_DIR" ]; then
    echo "📁 Creando directorio $ANDROID_DIR"
    mkdir -p "$ANDROID_DIR"
fi

# Verificar si el keystore de debug existe
if [ ! -f "$DEBUG_KEYSTORE_PATH" ]; then
    echo "🔑 Generando keystore de debug..."
    
    # Generar el keystore de debug con los parámetros estándar de Android
    keytool -genkey -v \
        -keystore "$DEBUG_KEYSTORE_PATH" \
        -storepass android \
        -alias androiddebugkey \
        -keypass android \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=Android Debug,O=Android,C=US" \
        -noprompt
    
    if [ $? -eq 0 ]; then
        echo "✅ Keystore de debug generado exitosamente en $DEBUG_KEYSTORE_PATH"
    else
        echo "❌ Error al generar el keystore de debug"
        exit 1
    fi
else
    echo "✅ Keystore de debug ya existe en $DEBUG_KEYSTORE_PATH"
fi

echo "🔧 Configuración de keystore completada"

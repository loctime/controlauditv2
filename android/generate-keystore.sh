#!/bin/bash

# Script para generar keystore de debug para ControlAudit
echo "🔑 Generando keystore de debug para ControlAudit..."

# Verificar si ya existe el keystore
if [ -f "app/debug.keystore" ]; then
    echo "✅ Keystore ya existe en app/debug.keystore"
    exit 0
fi

# Generar keystore de debug
keytool -genkey -v \
    -keystore app/debug.keystore \
    -storepass android \
    -alias androiddebugkey \
    -keypass android \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US"

if [ $? -eq 0 ]; then
    echo "✅ Keystore generado exitosamente en app/debug.keystore"
    echo "📋 Detalles del keystore:"
    echo "   - Store Password: android"
    echo "   - Key Alias: androiddebugkey"
    echo "   - Key Password: android"
else
    echo "❌ Error generando keystore"
    exit 1
fi

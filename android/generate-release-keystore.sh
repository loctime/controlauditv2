#!/bin/bash

# Script para generar keystore de release para ControlAudit
# Uso: ./generate-release-keystore.sh

echo "🔐 Generando keystore de release para ControlAudit..."
echo ""

# Crear directorio para keystore si no existe
mkdir -p keystore

# Generar keystore
keytool -genkey -v \
  -keystore keystore/controlaudit-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias controlaudit_key \
  -storetype JKS

echo ""
echo "✅ Keystore generado exitosamente!"
echo ""
echo "📝 Configuración para gradle.properties:"
echo "MYAPP_UPLOAD_STORE_FILE=keystore/controlaudit-release.jks"
echo "MYAPP_UPLOAD_STORE_PASSWORD=[el_password_que_ingresaste]"
echo "MYAPP_UPLOAD_KEY_ALIAS=controlaudit_key"
echo "MYAPP_UPLOAD_KEY_PASSWORD=[el_password_que_ingresaste]"
echo ""
echo "⚠️  IMPORTANTE:"
echo "- Guarda el keystore en un lugar seguro"
echo "- No lo subas al repositorio (está en .gitignore)"
echo "- Recuerda las contraseñas que ingresaste"
echo "- Este keystore es necesario para actualizar la app en Google Play"

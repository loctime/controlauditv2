#!/usr/bin/env node

/**
 * Script para corregir la configuración del backend
 * Uso: node fix-backend-config.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixBackendConfig() {
  console.log('🔧 CORRIGIENDO CONFIGURACIÓN DEL BACKEND');
  console.log('=========================================');
  console.log('');

  try {
    // 1. Verificar archivos de configuración
    console.log('1️⃣ VERIFICANDO ARCHIVOS DE CONFIGURACIÓN');
    console.log('----------------------------------------');
    
    const backendDir = path.join(__dirname, 'backend');
    const envLocalPath = path.join(backendDir, 'env.local');
    const envLocalBrokenPath = path.join(backendDir, 'env.local.broken');
    const envLocalFixedPath = path.join(backendDir, 'env.local.fixed');
    
    console.log('📁 Directorio backend:', backendDir);
    console.log('📄 env.local:', await fs.access(envLocalPath).then(() => '✅ Existe').catch(() => '❌ No existe'));
    console.log('📄 env.local.broken:', await fs.access(envLocalBrokenPath).then(() => '✅ Existe').catch(() => '❌ No existe'));
    console.log('📄 env.local.fixed:', await fs.access(envLocalFixedPath).then(() => '✅ Existe').catch(() => '❌ No existe'));
    console.log('');

    // 2. Leer configuración actual
    console.log('2️⃣ LEYENDO CONFIGURACIÓN ACTUAL');
    console.log('-------------------------------');
    
    let currentConfig = '';
    try {
      currentConfig = await fs.readFile(envLocalPath, 'utf8');
      console.log('✅ Configuración actual leída');
      console.log('📋 Contenido actual:');
      console.log(currentConfig);
    } catch (error) {
      console.log('❌ No se pudo leer la configuración actual:', error.message);
    }
    console.log('');

    // 3. Crear configuración corregida para producción
    console.log('3️⃣ CREANDO CONFIGURACIÓN CORREGIDA');
    console.log('----------------------------------');
    
    const correctedConfig = `# Firebase Admin SDK Configuration - PRODUCCIÓN
FIREBASE_PROJECT_ID=auditoria-f9fc4
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-pyief@auditoria-f9fc4.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCMLuk7rx3PuhZQ
rS7l2D3AD8a1dIc5l+A9jSbj3YGaNaOBmJHgScEhgjG2BAqOy/Awa1GwLzUJ7jsw
Fq3n1lRAibueAHtVjA6juw7GnkWi1NIGLEKBCQussfBCe9unS6kL8sAEWq1xGblI
VxLNzPRFqreaFrKDXWGZWuEAz9iE03w0zCodswhUcOECH6jIcL/7g3cJ6ZrtJUjR
beM1Jy4tYdXnYz/+jovjt+U+UTf9sAJFXnapzDbzsI3VAQr/zYCb1I7vI+zov6LG
qfjESyL/SGS0Bqx9rL7U+8/5szynIlWBLRAgs4+20yGMPNLs+iIJXp+GY8/YZ10L
zUfD9xzvAgMBAAECggEAKXzowiU9qXDlkdLvgk7RV7pTkPh/3Oe6Ef1oeR/hb4ZY
cc55veuWIRirJbdkeIaa+3mHn6EZDWtYUQ8lQOwJ21/oCwcReWwOGR8PbHEDIwHh
dro6pH3M2rt+4+5MP+MAkOyzL5a2pjZ6w5Ihmo8B7GxuEkiNZJuKexyOYvMgnY6Z
mKF8sWE9lg82WA7VWs5lGNzcw+UI/vOWnZjRB3Fcm0TTxhs8Wb0bq2nKKAaw/8+r
jblLHts7zVPDwM+cOBfRSG+4UCTkrf8I+656JsKsHnaEajQQfsMMSlJkVRIUC+2n
EdxDfMSWzU3hZ46ZM3kugS+LSlYG7/0p1xN42uHBYQKBgQDBLlegrUfKpjVTrv6z
7iTPZ1LmXT0IrptV+IN1gAzaU5scta63mmHd2ufg5zYkaUWxW1A5cdvVEyzHF2oY
AM1AySXbGLII5rWGnKBD2Z/IAs1ctbcfTeX5rZFyDDl4MJJoTEp9GCHffqjM7GPQ
JN9WyxnD7cTnTvdOaVAhWxlq3QKBgQC5xK99oM5L/0LwHNcvHbfn0yXGCiYyokJ/
Q8dxqeD9/6npCjpjDYUJ/tCuvJC93IYKoGVxvzhOVe9o6tfEYe/q7R6C2KV1vDI/
ShdbM+JhyCBl57VbNLE+FnxjNtP6cf/dKdwdmuoE4Gl9XNoBAxjrhaw5EfpHVDg6
twIxXBusOwKBgQCurDJ7jHLPn720LxUKqJgMGQbyWPgo84htEcn74o68ksA8E2Mp
jKRVL+xehXGFNtLXbRN6/aKiZTYlxtwdXAw7OiXKl+fS+JjGYLTg5NP+y9nYrE4q
Ngtt2S0cDEWikXiwadsohTuLlEEZGd2ehNiU6AwiBsn1xIcFFWBo6LBw2QKBgE7a
wY93MfqqeRSJeYIjgEwkodUlu78kh0uUTtXdwYav/sTQNaaUN5PdmWGC44HkWPWr
zkPxYopGCiEkBsDyva+gRaJPKjUG1OFupuls5bySAcagC6iSfmYXj2dh/6tAttZ/
jVL3zjyRsdWoE1X4pZxcGpYDHpUml9O8mW6wZYK/AoGAXU8Oxh9cSFk9XG8tGNr4
TzaSIgguZKwYJN5+rmu6B5qTxJsJhEDOsTX/SFjmZpRIhCUxTgyG/EN/+3iPgtd9
K/VNSL4bNUHJjiCk1ToSEiek8vYUswC4y8IaAqsz/j+or/R0fpb5QknzVXO9FTvj
9AwZ/7dwMSSthTe8p0ZVcvc=
-----END PRIVATE KEY-----"
FIREBASE_PRIVATE_KEY_ID=2c8ce6cf88e6c677a823964f0b83d3f20c257b7e
FIREBASE_CLIENT_ID=101016225640294384739

# Environment - PRODUCCIÓN
NODE_ENV=production
PORT=4000

# CORS Configuration - PRODUCCIÓN
CORS_ORIGIN=https://auditoria.controldoc.app,https://controlauditv2.onrender.com,https://*.controldoc.app,https://*.vercel.app,https://*.onrender.com

# Logging Configuration
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true

# Security Configuration
JWT_SECRET=your-production-secret-key-here
BCRYPT_ROUNDS=12

# Database Configuration
DATABASE_URL=https://auditoria-f9fc4-default-rtdb.firebaseio.com

# Upload Configuration
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# ControlFile Configuration
CONTROLFILE_ENABLED=true
CONTROLFILE_BASE_URL=https://controlauditv2.onrender.com
CONTROLFILE_TIMEOUT=30000

# Monitoring Configuration
ENABLE_HEALTH_CHECKS=true
HEALTH_CHECK_INTERVAL=30000
`;

    console.log('✅ Configuración corregida creada');
    console.log('📋 Cambios principales:');
    console.log('   • NODE_ENV cambiado a production');
    console.log('   • CORS_ORIGIN actualizado para producción');
    console.log('   • Configuración de logging mejorada');
    console.log('   • Configuración de seguridad agregada');
    console.log('   • Configuración de ControlFile agregada');
    console.log('');

    // 4. Crear backup y aplicar cambios
    console.log('4️⃣ APLICANDO CAMBIOS');
    console.log('---------------------');
    
    // Crear backup
    const backupPath = path.join(backendDir, `env.local.backup.${Date.now()}`);
    if (currentConfig) {
      await fs.writeFile(backupPath, currentConfig);
      console.log('✅ Backup creado:', backupPath);
    }
    
    // Aplicar configuración corregida
    await fs.writeFile(envLocalPath, correctedConfig);
    console.log('✅ Configuración corregida aplicada');
    console.log('');

    // 5. Verificar cambios
    console.log('5️⃣ VERIFICANDO CAMBIOS');
    console.log('----------------------');
    
    const newConfig = await fs.readFile(envLocalPath, 'utf8');
    console.log('✅ Nueva configuración aplicada correctamente');
    console.log('📋 Verificación:');
    console.log('   • NODE_ENV=production:', newConfig.includes('NODE_ENV=production') ? '✅' : '❌');
    console.log('   • CORS_ORIGIN actualizado:', newConfig.includes('https://auditoria.controldoc.app') ? '✅' : '❌');
    console.log('   • Firebase configurado:', newConfig.includes('FIREBASE_PROJECT_ID=auditoria-f9fc4') ? '✅' : '❌');
    console.log('');

    // 6. Instrucciones para el usuario
    console.log('6️⃣ INSTRUCCIONES PARA EL USUARIO');
    console.log('--------------------------------');
    console.log('🎯 Para aplicar los cambios:');
    console.log('');
    console.log('   1. Reiniciar el backend en Render:');
    console.log('      • Ir a https://dashboard.render.com');
    console.log('      • Seleccionar el servicio controlauditv2');
    console.log('      • Hacer clic en "Manual Deploy"');
    console.log('      • Seleccionar "Clear build cache & deploy"');
    console.log('');
    console.log('   2. Esperar a que el deploy termine (2-3 minutos)');
    console.log('');
    console.log('   3. Probar la aplicación:');
    console.log('      • Ir a https://auditoria.controldoc.app');
    console.log('      • Cerrar sesión si estás logueado');
    console.log('      • Limpiar caché del navegador');
    console.log('      • Volver a iniciar sesión');
    console.log('');
    console.log('   4. Verificar que los errores 401 se han solucionado');
    console.log('');
    console.log('⚠️ NOTA: Si el problema persiste después del deploy,');
    console.log('   puede ser necesario verificar los logs del backend');
    console.log('   en Render para más detalles.');
    console.log('');

  } catch (error) {
    console.error('💥 Error corrigiendo configuración:', error);
    console.error('🔍 Detalles:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
}

// Ejecutar la corrección
fixBackendConfig();

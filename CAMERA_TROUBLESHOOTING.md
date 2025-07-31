# Solución de Problemas de Cámara Web

## Problemas Comunes y Soluciones

### 1. **Permiso Denegado (NotAllowedError)**
**Síntoma:** El navegador muestra "Permiso denegado" al intentar acceder a la cámara.

**Soluciones:**
- Hacer clic en el ícono de cámara en la barra de direcciones y permitir el acceso
- Recargar la página después de permitir los permisos
- Verificar que no haya bloqueadores de anuncios activos
- En Chrome: ir a Configuración > Privacidad y seguridad > Configuración del sitio > Cámara

### 2. **Cámara No Encontrada (NotFoundError)**
**Síntoma:** El sistema no puede encontrar ninguna cámara en el dispositivo.

**Soluciones:**
- Verificar que el dispositivo tenga cámara
- Asegurar que la cámara no esté siendo usada por otra aplicación
- Reiniciar el navegador
- Verificar drivers de cámara en Windows

### 3. **Cámara en Uso (NotReadableError)**
**Síntoma:** La cámara está siendo usada por otra aplicación.

**Soluciones:**
- Cerrar otras aplicaciones que usen la cámara (Zoom, Teams, etc.)
- Reiniciar el navegador
- En casos extremos, reiniciar el dispositivo

### 4. **Navegador No Compatible (NotSupportedError)**
**Síntoma:** El navegador no soporta la API de cámara web.

**Soluciones:**
- Usar navegadores modernos: Chrome, Firefox, Safari, Edge
- Actualizar el navegador a la última versión
- Verificar que JavaScript esté habilitado

### 5. **Problemas de HTTPS**
**Síntoma:** La cámara no funciona en conexiones HTTP (excepto localhost).

**Soluciones:**
- Usar HTTPS en producción
- En desarrollo local, usar `localhost` o `127.0.0.1`
- Configurar certificados SSL válidos

### 6. **Problemas de Rendimiento**
**Síntoma:** La cámara funciona pero es lenta o se congela.

**Soluciones:**
- Cerrar otras pestañas del navegador
- Verificar que no haya muchas aplicaciones abiertas
- Usar un dispositivo con mejor rendimiento
- Verificar conexión a internet estable

## Verificación de Compatibilidad

### Navegadores Soportados
- ✅ Chrome 53+
- ✅ Firefox 36+
- ✅ Safari 11+
- ✅ Edge 12+
- ❌ Internet Explorer (no soportado)

### Requisitos Técnicos
- Conexión HTTPS (excepto localhost)
- JavaScript habilitado
- Permisos de cámara
- Cámara física disponible
- Navegador actualizado

## Comandos de Diagnóstico

### Verificar Permisos en Chrome
1. Abrir DevTools (F12)
2. Ir a la pestaña "Application"
3. En "Permissions" > "Camera"
4. Verificar que esté en "Allow"

### Verificar Cámaras Disponibles
```javascript
// En la consola del navegador
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    console.log('Cámaras disponibles:', videoDevices);
  });
```

### Probar Cámara Básica
```javascript
// En la consola del navegador
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('✅ Cámara funciona correctamente');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => {
    console.error('❌ Error de cámara:', error);
  });
```

## Logs de Debug

El sistema incluye logs detallados en la consola del navegador:

- `🔍 Verificando compatibilidad del navegador`
- `🔄 Iniciando cámara...`
- `📹 Intentando con configuración HD...`
- `⚠️ Fallback a configuración básica`
- `✅ Cámara iniciada correctamente`
- `📐 Dimensiones del video: 1280x720`
- `📸 Capturando foto...`
- `✅ Foto capturada y guardada exitosamente`

## Contacto

Si los problemas persisten después de intentar estas soluciones, contactar al equipo de desarrollo con:

1. Navegador y versión
2. Sistema operativo
3. Mensajes de error específicos
4. Pasos para reproducir el problema
5. Capturas de pantalla si es posible 
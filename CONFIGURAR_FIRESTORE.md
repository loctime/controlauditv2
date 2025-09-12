# Configuración de Reglas de Firestore

## Problema
El usuario no puede acceder a la colección `usuarios` en Firestore debido a reglas restrictivas.

## Solución
Necesitas configurar las reglas de Firestore manualmente en la consola de Firebase.

### Pasos:

1. **Ve a la consola de Firebase:**
   - Abre https://console.firebase.google.com/
   - Selecciona tu proyecto (probablemente `auditoria-f9fc4` o similar)

2. **Navega a Firestore Database:**
   - En el menú lateral, haz clic en "Firestore Database"
   - Ve a la pestaña "Reglas"

3. **Reemplaza las reglas actuales:**
   - Copia el contenido del archivo `firestore.rules` en este proyecto
   - Pega el contenido en el editor de reglas
   - Haz clic en "Publicar"

### Reglas incluidas:
- ✅ Usuarios pueden leer/escribir su propio perfil
- ✅ Supermax puede leer todos los usuarios
- ✅ Max puede leer sus operarios
- ✅ Acceso a empresas, reportes, formularios y sucursales
- ✅ Sistema de permisos basado en roles

### Verificación:
Después de publicar las reglas, el usuario `1@gmail.com` debería poder:
- ✅ Iniciar sesión correctamente
- ✅ Ver su rol `supermax`
- ✅ Acceder al dashboard
- ✅ Ver todas las funcionalidades

### Nota:
Si el proyecto de Firebase es diferente, actualiza el `projectId` en `src/firebaseConfig.js` con el ID correcto.

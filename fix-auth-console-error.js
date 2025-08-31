// Script para solucionar el error "auth is not defined" en la consola del navegador
// Este error ocurre cuando se ejecuta código directamente en la consola del navegador

console.log('🔧 Solucionando error "auth is not defined"...');

// Verificar si estamos en el navegador
if (typeof window !== 'undefined') {
  // Crear una función global para obtener el token de Firebase
  window.getFirebaseToken = async () => {
    try {
      // Importar Firebase dinámicamente
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      
      // Configuración de Firebase
      const firebaseConfig = {
        apiKey: "AIzaSyD7pmD_EVRf0dJcocynpaXAdu3tveycrzg",
        authDomain: "auditoria-f9fc4.firebaseapp.com",
        projectId: "auditoria-f9fc4",
        storageBucket: "auditoria-f9fc4.appspot.com",
        messagingSenderId: "156800340171",
        appId: "1:156800340171:web:fbe017105fd68b0f114b4e"
      };
      
      // Inicializar Firebase
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      
      // Verificar si hay usuario autenticado
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true);
        console.log('✅ Token obtenido:', token.substring(0, 20) + '...');
        return token;
      } else {
        console.log('❌ No hay usuario autenticado');
        return null;
      }
    } catch (error) {
      console.error('❌ Error obteniendo token:', error);
      return null;
    }
  };
  
  // Función para verificar el estado de autenticación
  window.checkAuthStatus = () => {
    try {
      // Intentar acceder a auth desde el contexto de la aplicación
      if (window.auth) {
        console.log('✅ auth disponible en window.auth');
        return window.auth.currentUser;
      } else if (window.firebase && window.firebase.auth) {
        console.log('✅ auth disponible en window.firebase.auth');
        return window.firebase.auth().currentUser;
      } else {
        console.log('❌ auth no disponible en el contexto global');
        return null;
      }
    } catch (error) {
      console.error('❌ Error verificando auth:', error);
      return null;
    }
  };
  
  // Función para limpiar errores de consola
  window.clearAuthErrors = () => {
    // Sobrescribir console.error temporalmente para filtrar errores de auth
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('auth is not defined') || message.includes('ReferenceError: auth')) {
        console.warn('⚠️ Error de auth filtrado (ejecutar getFirebaseToken() para obtener token)');
        return;
      }
      originalError.apply(console, args);
    };
    
    console.log('✅ Filtro de errores de auth activado');
  };
  
  console.log('✅ Funciones de ayuda disponibles:');
  console.log('  - getFirebaseToken(): Obtener token de Firebase');
  console.log('  - checkAuthStatus(): Verificar estado de autenticación');
  console.log('  - clearAuthErrors(): Limpiar errores de auth');
  
} else {
  console.log('❌ Este script debe ejecutarse en el navegador');
}

// Función para verificar si hay problemas de importación
const checkImportIssues = () => {
  const issues = [];
  
  // Verificar si Firebase está disponible
  if (typeof window !== 'undefined') {
    if (!window.firebase) {
      issues.push('Firebase no está disponible globalmente');
    }
    
    // Verificar si hay errores de módulos
    const scripts = document.querySelectorAll('script[src*="firebase"]');
    if (scripts.length === 0) {
      issues.push('No se encontraron scripts de Firebase cargados');
    }
  }
  
  return issues;
};

// Exportar funciones para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFirebaseToken: window?.getFirebaseToken,
    checkAuthStatus: window?.checkAuthStatus,
    clearAuthErrors: window?.clearAuthErrors,
    checkImportIssues
  };
}

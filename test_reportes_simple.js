// Script simple para verificar reportes en Firebase
// Ejecutar con: node test_reportes_simple.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

// Configuración de Firebase (necesitas agregar tu configuración aquí)
const firebaseConfig = {
  // Agrega tu configuración de Firebase aquí
  // apiKey: "tu-api-key",
  // authDomain: "tu-auth-domain",
  // projectId: "tu-project-id",
  // storageBucket: "tu-storage-bucket",
  // messagingSenderId: "tu-messaging-sender-id",
  // appId: "tu-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verificarReportes() {
  try {
    console.log('🔍 Verificando reportes en Firebase...');
    
    // 1. Consultar TODOS los reportes sin filtros
    const reportesRef = collection(db, "reportes");
    const q = query(reportesRef, orderBy("fechaCreacion", "desc"), limit(10));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 Total de reportes encontrados: ${querySnapshot.size}`);
    
    if (querySnapshot.size === 0) {
      console.log('❌ No hay reportes en la base de datos');
      console.log('💡 Esto significa que:');
      console.log('   - No se han completado auditorías aún');
      console.log('   - O hay un problema con el guardado');
      console.log('   - O la configuración de Firebase es incorrecta');
      return;
    }
    
    // 2. Mostrar información de cada reporte
    console.log('\n📋 Detalles de los reportes:');
    querySnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n--- Reporte ${index + 1} ---`);
      console.log(`ID: ${doc.id}`);
      console.log(`Empresa: ${data.empresaNombre || data.empresa?.nombre || 'N/A'}`);
      console.log(`Formulario: ${data.nombreForm || data.formulario?.nombre || 'N/A'}`);
      console.log(`Estado: ${data.estado || 'N/A'}`);
      console.log(`Fecha: ${data.fechaCreacion || 'N/A'}`);
      console.log(`Usuario ID: ${data.usuarioId || 'N/A'}`);
      console.log(`Cliente Admin ID: ${data.clienteAdminId || 'N/A'}`);
      console.log(`Auditor: ${data.auditor || 'N/A'}`);
    });
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error al verificar reportes:', error);
    console.log('\n💡 Posibles causas:');
    console.log('   - Configuración de Firebase incorrecta');
    console.log('   - Problemas de conectividad');
    console.log('   - Permisos de Firestore insuficientes');
  }
}

// Ejecutar la verificación
verificarReportes();

// Script de prueba para verificar el guardado y consulta de reportes
// Ejecutar con: node test_reportes.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');

// Configuración de Firebase (usar la misma que en el proyecto)
const firebaseConfig = {
  // Aquí deberías poner tu configuración de Firebase
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

async function testReportes() {
  try {
    console.log('🔍 Iniciando prueba de reportes...');
    
    // 1. Consultar todos los reportes
    console.log('\n📋 Consultando todos los reportes...');
    const reportesRef = collection(db, "reportes");
    const q = query(reportesRef, orderBy("fechaCreacion", "desc"), limit(10));
    const querySnapshot = await getDocs(q);
    
    console.log(`✅ Encontrados ${querySnapshot.size} reportes`);
    
    // 2. Analizar estructura de cada reporte
    querySnapshot.forEach((doc, index) => {
      const reporte = doc.data();
      console.log(`\n📄 Reporte ${index + 1} (ID: ${doc.id}):`);
      console.log(`   - Empresa: ${reporte.empresaNombre || 'N/A'}`);
      console.log(`   - Sucursal: ${reporte.sucursal || 'N/A'}`);
      console.log(`   - Formulario: ${reporte.nombreForm || reporte.formularioNombre || 'N/A'}`);
      console.log(`   - Auditor: ${reporte.auditor || 'N/A'}`);
      console.log(`   - Creado por: ${reporte.creadoPor || 'N/A'}`);
      console.log(`   - Usuario ID: ${reporte.usuarioId || 'N/A'}`);
      console.log(`   - Cliente Admin ID: ${reporte.clienteAdminId || 'N/A'}`);
      console.log(`   - Fecha: ${reporte.fechaCreacion || 'N/A'}`);
      console.log(`   - Estado: ${reporte.estado || 'N/A'}`);
      
      // Verificar campos críticos
      const camposFaltantes = [];
      if (!reporte.empresaNombre) camposFaltantes.push('empresaNombre');
      if (!reporte.nombreForm && !reporte.formularioNombre) camposFaltantes.push('nombreForm/formularioNombre');
      if (!reporte.auditor) camposFaltantes.push('auditor');
      if (!reporte.usuarioId) camposFaltantes.push('usuarioId');
      if (!reporte.clienteAdminId) camposFaltantes.push('clienteAdminId');
      
      if (camposFaltantes.length > 0) {
        console.log(`   ⚠️  Campos faltantes: ${camposFaltantes.join(', ')}`);
      } else {
        console.log(`   ✅ Todos los campos críticos presentes`);
      }
    });
    
    // 3. Probar filtros específicos
    console.log('\n🔍 Probando filtros específicos...');
    
    // Filtrar por clienteAdminId
    const qCliente = query(reportesRef, where("clienteAdminId", "!=", null), limit(5));
    const snapshotCliente = await getDocs(qCliente);
    console.log(`✅ Reportes con clienteAdminId: ${snapshotCliente.size}`);
    
    // Filtrar por usuarioId
    const qUsuario = query(reportesRef, where("usuarioId", "!=", null), limit(5));
    const snapshotUsuario = await getDocs(qUsuario);
    console.log(`✅ Reportes con usuarioId: ${snapshotUsuario.size}`);
    
    // Filtrar por auditor
    const qAuditor = query(reportesRef, where("auditor", "!=", null), limit(5));
    const snapshotAuditor = await getDocs(qAuditor);
    console.log(`✅ Reportes con auditor: ${snapshotAuditor.size}`);
    
    console.log('\n✅ Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testReportes();

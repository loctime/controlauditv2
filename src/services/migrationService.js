// Servicio para migrar todos los datos relacionados con un UID antiguo a un UID nuevo
// Migra automáticamente empresas, formularios, reportes, sucursales, empleados, etc.
// 
// NOTA LEGACY: Este servicio usa dbAudit directamente para colecciones sin helpers.
// Algunas colecciones (empresas, formularios, empleados, capacitaciones, accidentes) 
// no tienen helpers centralizados y se acceden directamente con collection(dbAudit, ...).

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc,
  writeBatch
} from 'firebase/firestore';
import { dbAudit, sucursalesCollection, reportesCollection, auditUsersCollection } from '../firebaseControlFile';

/**
 * Migra todos los datos relacionados con un UID antiguo a un UID nuevo
 * 
 * @param {string} oldUid - UID antiguo del usuario
 * @param {string} newUid - UID nuevo del usuario
 * @returns {Promise<Object>} - Resumen de la migración
 */
export const migrateAllUserData = async (oldUid, newUid) => {
  console.log(`[migrationService] 🚀 Iniciando migración completa de ${oldUid} → ${newUid}`);
  
  const migrationSummary = {
    empresas: 0,
    formularios: 0,
    reportes: 0,
    sucursales: 0,
    empleados: 0,
    capacitaciones: 0,
    accidentes: 0,
    usuariosOperarios: 0,
    total: 0
  };

  try {
    // Función auxiliar para ejecutar batches en lotes
    const executeBatchInChunks = async (updates, collectionName) => {
      const BATCH_LIMIT = 500;
      const chunks = [];
      
      for (let i = 0; i < updates.length; i += BATCH_LIMIT) {
        chunks.push(updates.slice(i, i + BATCH_LIMIT));
      }
      
      for (const chunk of chunks) {
        const batch = writeBatch(dbAudit);
        chunk.forEach(({ docRef, data }) => {
          batch.update(docRef, data);
        });
        await batch.commit();
      }
    };

    // 1. Migrar EMPRESAS
    // NOTA: No hay helper para 'empresas', usando collection directa con dbAudit
    console.log('[migrationService] 📦 Migrando empresas...');
    const empresasRef = collection(dbAudit, 'empresas');
    const empresasQuery = query(empresasRef, where('propietarioId', '==', oldUid));
    const empresasSnapshot = await getDocs(empresasQuery);
    
    const empresasUpdates = [];
    empresasSnapshot.docs.forEach(docSnap => {
      empresasUpdates.push({
        docRef: doc(dbAudit, 'empresas', docSnap.id),
        data: {
          propietarioId: newUid,
          lastUidUpdate: new Date(),
          migratedFromUid: oldUid
        }
      });
      migrationSummary.empresas++;
    });

    // También buscar por creadorId
    const empresasCreadorQuery = query(empresasRef, where('creadorId', '==', oldUid));
    const empresasCreadorSnapshot = await getDocs(empresasCreadorQuery);
    
    empresasCreadorSnapshot.docs.forEach(docSnap => {
      const empresaData = docSnap.data();
      // Solo actualizar si propietarioId no es el oldUid (para evitar duplicados)
      if (empresaData.propietarioId !== oldUid) {
        empresasUpdates.push({
          docRef: doc(dbAudit, 'empresas', docSnap.id),
          data: {
            creadorId: newUid,
            lastUidUpdate: new Date(),
            migratedFromUid: oldUid
          }
        });
        migrationSummary.empresas++;
      }
    });

    // Ejecutar todas las migraciones en paralelo para mayor velocidad
    const migrationPromises = [];

    if (empresasUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(empresasUpdates, 'empresas'));
    }

    // 2. Migrar FORMULARIOS
    // NOTA: No hay helper para 'formularios', usando collection directa con dbAudit
    console.log('[migrationService] 📋 Migrando formularios...');
    const formulariosRef = collection(dbAudit, 'formularios');
    const formulariosQuery = query(formulariosRef, where('creadorId', '==', oldUid));
    const formulariosSnapshot = await getDocs(formulariosQuery);
    
    const formulariosUpdates = [];
    formulariosSnapshot.docs.forEach(docSnap => {
      const formularioData = docSnap.data();
      const updates = {
        creadorId: newUid,
        lastUidUpdate: new Date(),
        migratedFromUid: oldUid
      };

      // Actualizar clienteAdminId si es el oldUid
      if (formularioData.clienteAdminId === oldUid) {
        updates.clienteAdminId = newUid;
      }

      // Actualizar arrays de permisos
      if (formularioData.permisos) {
        const permisos = { ...formularioData.permisos };
        ['puedeEditar', 'puedeVer', 'puedeEliminar'].forEach(campo => {
          if (Array.isArray(permisos[campo])) {
            permisos[campo] = permisos[campo].map(uid => uid === oldUid ? newUid : uid);
          }
        });
        updates.permisos = permisos;
      }

      formulariosUpdates.push({
        docRef: doc(dbAudit, 'formularios', docSnap.id),
        data: updates
      });
      migrationSummary.formularios++;
    });

    // También buscar por clienteAdminId
    const formulariosAdminQuery = query(formulariosRef, where('clienteAdminId', '==', oldUid));
    const formulariosAdminSnapshot = await getDocs(formulariosAdminQuery);
    
    formulariosAdminSnapshot.docs.forEach(docSnap => {
      const formularioData = docSnap.data();
      // Solo actualizar si creadorId no es el oldUid
      if (formularioData.creadorId !== oldUid) {
        formulariosUpdates.push({
          docRef: doc(dbAudit, 'formularios', docSnap.id),
          data: {
            clienteAdminId: newUid,
            lastUidUpdate: new Date(),
            migratedFromUid: oldUid
          }
        });
        migrationSummary.formularios++;
      }
    });

    if (formulariosUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(formulariosUpdates, 'formularios'));
    }

    // 3. Migrar REPORTES/AUDITORIAS
    console.log('[migrationService] 📊 Migrando reportes/auditorías...');
    const reportesRef = reportesCollection();
    const reportesQuery = query(reportesRef, where('usuarioId', '==', oldUid));
    const reportesSnapshot = await getDocs(reportesQuery);
    
    const reportesUpdates = [];
    reportesSnapshot.docs.forEach(docSnap => {
      const reporteData = docSnap.data();
      const updates = {
        usuarioId: newUid,
        lastUidUpdate: new Date(),
        migratedFromUid: oldUid
      };

      // Actualizar creadoPor si existe
      if (reporteData.creadoPor === oldUid) {
        updates.creadoPor = newUid;
      }

      // Actualizar clienteAdminId si existe
      if (reporteData.clienteAdminId === oldUid) {
        updates.clienteAdminId = newUid;
      }

      reportesUpdates.push({
        docRef: doc(dbAudit, 'reportes', docSnap.id),
        data: updates
      });
      migrationSummary.reportes++;
    });

    if (reportesUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(reportesUpdates, 'reportes'));
    }

    // 4. Migrar SUCURSALES
    console.log('[migrationService] 🏢 Migrando sucursales...');
    const sucursalesRef = sucursalesCollection();
    const sucursalesQuery = query(sucursalesRef, where('creadorId', '==', oldUid));
    const sucursalesSnapshot = await getDocs(sucursalesQuery);
    
    const sucursalesUpdates = [];
    sucursalesSnapshot.docs.forEach(docSnap => {
      sucursalesUpdates.push({
        docRef: doc(dbAudit, 'sucursales', docSnap.id),
        data: {
          creadorId: newUid,
          lastUidUpdate: new Date(),
          migratedFromUid: oldUid
        }
      });
      migrationSummary.sucursales++;
    });

    if (sucursalesUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(sucursalesUpdates, 'sucursales'));
    }

    // 5. Migrar EMPLEADOS
    // NOTA: No hay helper para 'empleados', usando collection directa con dbAudit
    console.log('[migrationService] 👥 Migrando empleados...');
    const empleadosRef = collection(dbAudit, 'empleados');
    const empleadosQuery = query(empleadosRef, where('createdBy', '==', oldUid));
    const empleadosSnapshot = await getDocs(empleadosQuery);
    
    const empleadosUpdates = [];
    empleadosSnapshot.docs.forEach(docSnap => {
      empleadosUpdates.push({
        docRef: doc(dbAudit, 'empleados', docSnap.id),
        data: {
          createdBy: newUid,
          lastUidUpdate: new Date(),
          migratedFromUid: oldUid
        }
      });
      migrationSummary.empleados++;
    });

    if (empleadosUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(empleadosUpdates, 'empleados'));
    }

    // 6. Migrar CAPACITACIONES
    // NOTA: No hay helper para 'capacitaciones', usando collection directa con dbAudit
    console.log('[migrationService] 📚 Migrando capacitaciones...');
    const capacitacionesRef = collection(dbAudit, 'capacitaciones');
    const capacitacionesQuery = query(capacitacionesRef, where('createdBy', '==', oldUid));
    const capacitacionesSnapshot = await getDocs(capacitacionesQuery);
    
    const capacitacionesUpdates = [];
    capacitacionesSnapshot.docs.forEach(docSnap => {
      capacitacionesUpdates.push({
        docRef: doc(dbAudit, 'capacitaciones', docSnap.id),
        data: {
          createdBy: newUid,
          lastUidUpdate: new Date(),
          migratedFromUid: oldUid
        }
      });
      migrationSummary.capacitaciones++;
    });

    if (capacitacionesUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(capacitacionesUpdates, 'capacitaciones'));
    }

    // 7. Migrar ACCIDENTES
    // NOTA: No hay helper para 'accidentes', usando collection directa con dbAudit
    console.log('[migrationService] ⚠️ Migrando accidentes...');
    const accidentesRef = collection(dbAudit, 'accidentes');
    const accidentesQuery = query(accidentesRef, where('createdBy', '==', oldUid));
    const accidentesSnapshot = await getDocs(accidentesQuery);
    
    const accidentesUpdates = [];
    accidentesSnapshot.docs.forEach(docSnap => {
      accidentesUpdates.push({
        docRef: doc(dbAudit, 'accidentes', docSnap.id),
        data: {
          createdBy: newUid,
          lastUidUpdate: new Date(),
          migratedFromUid: oldUid
        }
      });
      migrationSummary.accidentes++;
    });

    if (accidentesUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(accidentesUpdates, 'accidentes'));
    }

    // 8. Migrar USUARIOS OPERARIOS (clienteAdminId)
    console.log('[migrationService] 👤 Migrando usuarios operarios...');
    const usuariosRef = auditUsersCollection();
    const usuariosQuery = query(usuariosRef, where('clienteAdminId', '==', oldUid));
    const usuariosSnapshot = await getDocs(usuariosQuery);
    
    const usuariosUpdates = [];
    usuariosSnapshot.docs.forEach(docSnap => {
      usuariosUpdates.push({
        docRef: doc(dbAudit, 'apps', 'audit', 'users', docSnap.id),
        data: {
          clienteAdminId: newUid,
          lastUidUpdate: new Date(),
          migratedFromUid: oldUid
        }
      });
      migrationSummary.usuariosOperarios++;
    });

    if (usuariosUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(usuariosUpdates, 'usuarios'));
    }

    // Ejecutar todas las migraciones en paralelo
    console.log(`[migrationService] 🚀 Ejecutando ${migrationPromises.length} migraciones en paralelo...`);
    await Promise.all(migrationPromises);

    // Calcular total
    migrationSummary.total = Object.values(migrationSummary).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    
    console.log('[migrationService] ✅ Migración completa:', migrationSummary);
    return migrationSummary;
    
  } catch (error) {
    console.error('[migrationService] ❌ Error en migración:', error);
    throw error;
  }
};


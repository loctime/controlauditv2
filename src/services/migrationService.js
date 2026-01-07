// Servicio para migrar todos los datos relacionados con un ownerId antiguo a un ownerId nuevo
// Migra automáticamente empresas, formularios, reportes, sucursales, empleados, etc.
// 
// NOTA: Este servicio migra datos dentro del modelo owner-centric.
// Todas las colecciones están bajo apps/auditoria/owners/{ownerId}/

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc
} from 'firebase/firestore';
import { dbAudit } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { writeBatchWithAppId } from '../firebase/firestoreAppWriter';

/**
 * Migra todos los datos relacionados con un ownerId antiguo a un ownerId nuevo (owner-centric)
 * 
 * @param {string} oldOwnerId - ownerId antiguo
 * @param {string} newOwnerId - ownerId nuevo
 * @returns {Promise<Object>} - Resumen de la migración
 */
export const migrateAllUserData = async (oldOwnerId, newOwnerId) => {
  console.log(`[migrationService] 🚀 Iniciando migración completa de ${oldOwnerId} → ${newOwnerId}`);
  
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
        const batch = writeBatchWithAppId(dbAudit);
        chunk.forEach(({ docRef, data }) => {
          batch.update(docRef, data);
        });
        await batch.commit();
      }
    };

    // 1. Migrar EMPRESAS (owner-centric)
    console.log('[migrationService] 📦 Migrando empresas...');
    const empresasRef = collection(dbAudit, ...firestoreRoutesCore.empresas(oldOwnerId));
    const empresasSnapshot = await getDocs(empresasRef);
    
    const empresasUpdates = [];
    empresasSnapshot.docs.forEach(docSnap => {
      empresasUpdates.push({
        docRef: doc(dbAudit, ...firestoreRoutesCore.empresa(newOwnerId, docSnap.id)),
        data: {
          lastOwnerIdUpdate: new Date(),
          migratedFromOwnerId: oldOwnerId
        }
      });
      migrationSummary.empresas++;
    });

    // Ejecutar todas las migraciones en paralelo para mayor velocidad
    const migrationPromises = [];

    if (empresasUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(empresasUpdates, 'empresas'));
    }

    // 2. Migrar FORMULARIOS (owner-centric)
    console.log('[migrationService] 📋 Migrando formularios...');
    const formulariosRef = collection(dbAudit, ...firestoreRoutesCore.formularios(oldOwnerId));
    const formulariosSnapshot = await getDocs(formulariosRef);
    
    const formulariosUpdates = [];
    formulariosSnapshot.docs.forEach(docSnap => {
      const formularioData = docSnap.data();
      const updates = {
        lastOwnerIdUpdate: new Date(),
        migratedFromOwnerId: oldOwnerId
      };

      // Actualizar arrays de permisos si contienen el oldOwnerId
      if (formularioData.permisos) {
        const permisos = { ...formularioData.permisos };
        ['puedeEditar', 'puedeVer', 'puedeEliminar'].forEach(campo => {
          if (Array.isArray(permisos[campo])) {
            permisos[campo] = permisos[campo].map(uid => uid === oldOwnerId ? newOwnerId : uid);
          }
        });
        updates.permisos = permisos;
      }

      formulariosUpdates.push({
        docRef: doc(dbAudit, ...firestoreRoutesCore.formulario(newOwnerId, docSnap.id)),
        data: updates
      });
      migrationSummary.formularios++;
    });

    if (formulariosUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(formulariosUpdates, 'formularios'));
    }

    // 3. Migrar REPORTES/AUDITORIAS (owner-centric)
    console.log('[migrationService] 📊 Migrando reportes/auditorías...');
    const reportesRef = collection(dbAudit, ...firestoreRoutesCore.reportes(oldOwnerId));
    const reportesSnapshot = await getDocs(reportesRef);
    
    const reportesUpdates = [];
    reportesSnapshot.docs.forEach(docSnap => {
      const reporteData = docSnap.data();
      const updates = {
        lastOwnerIdUpdate: new Date(),
        migratedFromOwnerId: oldOwnerId
      };

      // Actualizar creadoPor si existe y es el oldOwnerId
      if (reporteData.creadoPor === oldOwnerId) {
        updates.creadoPor = newOwnerId;
      }

      reportesUpdates.push({
        docRef: doc(dbAudit, ...firestoreRoutesCore.reporte(newOwnerId, docSnap.id)),
        data: updates
      });
      migrationSummary.reportes++;
    });

    if (reportesUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(reportesUpdates, 'reportes'));
    }

    // 4. Migrar SUCURSALES (owner-centric)
    console.log('[migrationService] 🏢 Migrando sucursales...');
    const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(oldOwnerId));
    const sucursalesSnapshot = await getDocs(sucursalesRef);
    
    const sucursalesUpdates = [];
    sucursalesSnapshot.docs.forEach(docSnap => {
      sucursalesUpdates.push({
        docRef: doc(dbAudit, ...firestoreRoutesCore.sucursal(newOwnerId, docSnap.id)),
        data: {
          lastOwnerIdUpdate: new Date(),
          migratedFromOwnerId: oldOwnerId
        }
      });
      migrationSummary.sucursales++;
    });

    if (sucursalesUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(sucursalesUpdates, 'sucursales'));
    }

    // 5. Migrar EMPLEADOS (owner-centric)
    console.log('[migrationService] 👥 Migrando empleados...');
    const empleadosRef = collection(dbAudit, ...firestoreRoutesCore.empleados(oldOwnerId));
    const empleadosSnapshot = await getDocs(empleadosRef);
    
    const empleadosUpdates = [];
    empleadosSnapshot.docs.forEach(docSnap => {
      empleadosUpdates.push({
        docRef: doc(dbAudit, ...firestoreRoutesCore.empleado(newOwnerId, docSnap.id)),
        data: {
          lastOwnerIdUpdate: new Date(),
          migratedFromOwnerId: oldOwnerId
        }
      });
      migrationSummary.empleados++;
    });

    if (empleadosUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(empleadosUpdates, 'empleados'));
    }

    // 6. Migrar CAPACITACIONES (owner-centric)
    console.log('[migrationService] 📚 Migrando capacitaciones...');
    const capacitacionesRef = collection(dbAudit, ...firestoreRoutesCore.capacitaciones(oldOwnerId));
    const capacitacionesSnapshot = await getDocs(capacitacionesRef);
    
    const capacitacionesUpdates = [];
    capacitacionesSnapshot.docs.forEach(docSnap => {
      capacitacionesUpdates.push({
        docRef: doc(dbAudit, ...firestoreRoutesCore.capacitacion(newOwnerId, docSnap.id)),
        data: {
          lastOwnerIdUpdate: new Date(),
          migratedFromOwnerId: oldOwnerId
        }
      });
      migrationSummary.capacitaciones++;
    });

    if (capacitacionesUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(capacitacionesUpdates, 'capacitaciones'));
    }

    // 7. Migrar ACCIDENTES (owner-centric)
    console.log('[migrationService] ⚠️ Migrando accidentes...');
    const accidentesRef = collection(dbAudit, ...firestoreRoutesCore.accidentes(oldOwnerId));
    const accidentesSnapshot = await getDocs(accidentesRef);
    
    const accidentesUpdates = [];
    accidentesSnapshot.docs.forEach(docSnap => {
      accidentesUpdates.push({
        docRef: doc(dbAudit, ...firestoreRoutesCore.accidente(newOwnerId, docSnap.id)),
        data: {
          lastOwnerIdUpdate: new Date(),
          migratedFromOwnerId: oldOwnerId
        }
      });
      migrationSummary.accidentes++;
    });

    if (accidentesUpdates.length > 0) {
      migrationPromises.push(executeBatchInChunks(accidentesUpdates, 'accidentes'));
    }

    // 8. Migrar USUARIOS OPERARIOS (owner-centric)
    console.log('[migrationService] 👤 Migrando usuarios operarios...');
    const usuariosRef = collection(dbAudit, ...firestoreRoutesCore.usuarios(oldOwnerId));
    const usuariosSnapshot = await getDocs(usuariosRef);
    
    const usuariosUpdates = [];
    usuariosSnapshot.docs.forEach(docSnap => {
      usuariosUpdates.push({
        docRef: doc(dbAudit, ...firestoreRoutesCore.usuario(newOwnerId, docSnap.id)),
        data: {
          lastOwnerIdUpdate: new Date(),
          migratedFromOwnerId: oldOwnerId
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


import logger from '@/utils/logger';
// src/services/empresaService.js
import { 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  onSnapshot,
  collection,
  collectionGroup
} from 'firebase/firestore';
import { registrarAccionSistema } from '../utils/firestoreUtils';
import { addDocWithAppId, updateDocWithAppId } from '../firebase/firestoreAppWriter';
import { dbAudit, db } from '../firebaseControlFile';
import { getEmpresas } from '../core/services/ownerEmpresaService';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';

export const empresaService = {


  /**
   * ✅ MODELO OWNER-CENTRIC PARA OPERARIOS - FETCH PURO
   * 
   * Obtiene empresas para un operario usando el modelo owner-centric.
   * Este es un método de FETCH PURO, sin listeners reactivos.
   * 
   * ⚠️ IMPORTANTE: Para listeners reactivos, usar useEmpresasQuery (única fuente reactiva)
   * 
   * Flujo CORRECTO (SIN QUERIES PARA EMPRESAS):
   * 1. Recibir ownerId como parámetro requerido (NO inferir desde userProfile)
   * 2. Leer documento del operario directamente con getDoc():
   *    apps/auditoria/owners/{ownerId}/usuarios/{userId}
   * 3. Extraer empresasAsignadas[] desde el documento
   * 4. Para cada empresaId, usar getDoc() directo:
   *    apps/auditoria/owners/{ownerId}/empresas/{empresaId}
   * 
   * ⚠️ NO usa:
   * - Inferencia de ownerId desde userProfile (no confiable)
   * - Queries para empresas (prohibido para operarios)
   * - Solo getDoc() directo está permitido
   * 
   * @param {string} userId - ID del usuario operario
   * @param {string} ownerId - ID del owner (REQUERIDO, no se infiere)
   */
  async getEmpresasForOperario(userId, ownerId) {
    try {
      if (!userId) {
        logger.debugProd('[empresaService][getEmpresasForOperario] userId no proporcionado');
        return { ownerId: null, empresas: [], empresasAsignadas: [], userDocRef: null, empresasQueryRef: null };
      }

      if (!ownerId) {
        logger.error('[empresaService][getEmpresasForOperario] ❌ ERROR: ownerId es requerido');
        logger.error('[empresaService][getEmpresasForOperario] userId:', userId);
        logger.error('[empresaService][getEmpresasForOperario] ownerId recibido:', ownerId);
        return { ownerId: null, empresas: [], empresasAsignadas: [], userDocRef: null, empresasQueryRef: null };
      }

      // ✅ 2. Leer documento del operario directamente con getDoc() (SIN QUERIES)
      // Path: apps/auditoria/owners/{ownerId}/usuarios/{userId}
      const userRef = doc(db, ...firestoreRoutesCore.usuario(ownerId, userId));
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        logger.error('[empresaService][getEmpresasForOperario] ❌ ERROR DE PROVISIONING: Operario no encontrado en owner-centric');
        logger.error('[empresaService][getEmpresasForOperario] Path:', userRef.path);
        logger.error('[empresaService][getEmpresasForOperario] userId:', userId);
        logger.error('[empresaService][getEmpresasForOperario] ownerId:', ownerId);
        return { ownerId: null, empresas: [], empresasAsignadas: [], userDocRef: null, empresasQueryRef: null };
      }

      const userData = userSnapshot.data();
      
      // ✅ 3. Obtener empresasAsignadas desde el documento
      const empresasAsignadas = userData.empresasAsignadas || [];

      logger.debugProd('[getUserEmpresas][OPERARIO] ownerId efectivo:', ownerId);
      logger.debugProd('[getUserEmpresas][OPERARIO] userId:', userId, 'ownerId:', ownerId);

      if (!empresasAsignadas || empresasAsignadas.length === 0) {
        logger.debugProd('[empresaService][getEmpresasForOperario] No hay empresas asignadas para el operario');
        // ⚠️ NO crear query para operarios (prohibido por reglas)
        // Retornar null en empresasQueryRef para indicar que no se puede escuchar
        return { 
          ownerId, 
          empresas: [], 
          empresasAsignadas: [],
          userDocRef: userRef, 
          empresasQueryRef: null // ⚠️ Operarios NO pueden usar queries
        };
      }

      logger.debugProd(`[empresaService][getEmpresasForOperario] 🔄 Resolviendo ${empresasAsignadas.length} empresas para operario ${userId} (ownerId: ${ownerId})`);

      // ✅ 4. Para cada empresaId, usar getDoc() directo (SIN QUERIES)
      const empresasPromises = empresasAsignadas.map(async (empresaId) => {
        try {
          const empresaRef = doc(db, ...firestoreRoutesCore.empresa(ownerId, empresaId));
          const empresaSnap = await getDoc(empresaRef);

          if (!empresaSnap.exists()) {
            logger.warn(`[empresaService][getEmpresasForOperario] Empresa ${empresaId} no encontrada`);
            return null;
          }

          const empresaData = empresaSnap.data();
          return {
            id: empresaSnap.id,
            ownerId: empresaData.ownerId || ownerId,
            nombre: empresaData.nombre,
            activa: empresaData.activa !== undefined ? empresaData.activa : true,
            createdAt: empresaData.createdAt?.toDate() || new Date()
          };
        } catch (error) {
          logger.error(`[empresaService][getEmpresasForOperario] Error al leer empresa ${empresaId}:`, error);
          return null;
        }
      });

      const empresas = (await Promise.all(empresasPromises)).filter(emp => emp !== null);

      logger.debugProd(`[empresaService][getEmpresasForOperario] ✅ Resueltas ${empresas.length} empresas para operario`);
      
      // ⚠️ NO crear query para operarios (prohibido por reglas de Firestore)
      // Los operarios solo pueden usar getDoc() directo
      // Retornar null en empresasQueryRef para indicar que no se puede escuchar
      
      return { 
        ownerId, 
        empresas, 
        empresasAsignadas,
        userDocRef: userRef,
        empresasQueryRef: null // ⚠️ Operarios NO pueden usar queries
      };
      } catch (error) {
        logger.error('[empresaService][getEmpresasForOperario] ❌ Error:', error);
        return { ownerId: null, empresas: [], empresasAsignadas: [], userDocRef: null, empresasQueryRef: null };
      }
    },

  /**
   * Mapea snapshots de empresas a array de empresas normalizadas
   * Filtra por empresasAsignadas si se proporciona
   * Única fuente de verdad para la estructura de una empresa
   */
  mapEmpresasSnapshots(snapshots, ownerId, empresasAsignadas = null) {
    const empresas = snapshots
      .map(snapshot => {
        if (!snapshot.exists()) {
          return null;
        }
        
        const empresaData = snapshot.data();
        return {
          id: snapshot.id,
          ownerId: empresaData.ownerId || ownerId,
          nombre: empresaData.nombre,
          activa: empresaData.activa !== undefined ? empresaData.activa : true,
          createdAt: empresaData.createdAt?.toDate() || new Date()
        };
      })
      .filter(emp => emp !== null);
    
    // Filtrar por empresasAsignadas si se proporciona
    if (empresasAsignadas && empresasAsignadas.length > 0) {
      const empresasAsignadasSet = new Set(empresasAsignadas);
      return empresas.filter(emp => empresasAsignadasSet.has(emp.id));
    }
    
    return empresas;
  },

  /**
   * ✅ MODELO OWNER-CENTRIC PARA OWNERS
   * 
   * Obtiene todas las empresas del owner usando el servicio owner-centric.
   */
  async getEmpresasForOwner(ownerId) {
    try {
      if (!ownerId) {
        logger.debug('[empresaService][getEmpresasForOwner] ownerId no proporcionado');
        return [];
      }

      logger.debug(`[empresaService][getEmpresasForOwner] 🔄 Leyendo empresas del owner ${ownerId}`);
      const empresas = await getEmpresas(ownerId);

      const empresasNormalizadas = empresas.map(emp => ({
        id: emp.id,
        nombre: emp.nombre,
        ownerId: emp.ownerId,
        activa: emp.activa,
        createdAt: emp.createdAt
      }));

      logger.debug(`[empresaService][getEmpresasForOwner] ✅ Encontradas ${empresasNormalizadas.length} empresas`);
      return empresasNormalizadas;
    } catch (error) {
      logger.error('[empresaService][getEmpresasForOwner] ❌ Error:', error);
      return [];
    }
  },


  // Obtener empresas del usuario usando modelo owner-centric
  async getUserEmpresas(params) {
    try {
      const { userId, role, userProfile } = 
        typeof params === 'object' && params !== null && !Array.isArray(params)
          ? params
          : { userId: params, role: arguments[1] };
      
      if (!userId) {
        logger.debugProd('[empresaService] getUserEmpresas: userId no proporcionado');
        return [];
      }

      // Para operarios: usar getEmpresasForOperario con ownerId desde token claims
      if (role === 'operario' || userProfile?.role === 'operario') {
        // ownerId debe venir del token claims, no de userProfile
        // Por ahora, si no está disponible, retornar vacío (se obtendrá desde token en AuthContext)
        const ownerId = userProfile?.ownerId;
        if (!ownerId) {
          logger.error('[empresaService][getUserEmpresas] ❌ ownerId no disponible para operario');
          return [];
        }
        
        const resultadoOperario = await this.getEmpresasForOperario(userId, ownerId);
        return resultadoOperario.empresas || [];
      }

      // Para owners: usar getEmpresasForOwner
      const ownerId = userProfile?.uid || userId;
      return await this.getEmpresasForOwner(ownerId);
    } catch (error) {
      logger.error("[empresaService] Error al obtener empresas del usuario:", error);
      return [];
    }
  },

  // Métodos legacy eliminados - usar ownerEmpresaService.ts en su lugar

  // Verificar si el usuario puede ver una empresa
  /**
   * Verifica si un usuario puede ver una empresa
   * 
   * Para operarios: usa empresas ya resueltas (no userProfile)
   * Para max/supermax: usa userProfile.empresas (legacy)
   */
  canViewEmpresa(empresaId, userProfile, empresasResueltas = null) {
    if (!userProfile) return false;
    
    if (userProfile.role === 'superdev') {
      return true;
    }
    
    if (userProfile.role === 'admin') {
      if (userProfile.empresas && userProfile.empresas.includes(empresaId)) {
        return true;
      }
      return false;
    }
    
    // ✅ OPERARIO: usar empresas ya resueltas, NO userProfile
    if (userProfile.role === 'operario') {
      // Si se proporcionan empresas resueltas, usar esas
      if (empresasResueltas && Array.isArray(empresasResueltas)) {
        return empresasResueltas.some(emp => emp.id === empresaId);
      }
      // Fallback: NO usar userProfile.empresas (no debe existir en /users)
      return false;
    }
    
    return false;
  },

};


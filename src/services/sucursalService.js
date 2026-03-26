import logger from '@/utils/logger';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { dbAudit } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { addDocWithAppId } from '../firebase/firestoreAppWriter';
import { trainingCatalogService, trainingRequirementService, trainingPlanService } from './training';
import { registrarAccionSistema, normalizeSucursal } from '../utils/firestoreUtils';

async function autoSeedTrainingRulesForBranch({ ownerId, companyId, branchId }) {
  if (!ownerId || !companyId || !branchId) {
    return { created: 0, skipped: 0, total: 0, reason: 'missing_params' };
  }

  const existing = await trainingRequirementService.listRules(ownerId, {
    companyId,
    branchId,
    status: 'active'
  });
  if (Array.isArray(existing) && existing.length > 0) {
    return { created: 0, skipped: existing.length, total: 0, reason: 'already_has_rules' };
  }

  const catalog = await trainingCatalogService.listActive(ownerId);
  const activeTrainings = Array.isArray(catalog) ? catalog : [];
  const effectiveFrom = new Date().toISOString().slice(0, 10);

  let created = 0;
  await Promise.all(activeTrainings.map(async (t) => {
    if (!t?.id) return;
    await trainingRequirementService.createRule(ownerId, {
      companyId,
      branchId,
      trainingTypeId: t.id,
      frequencyMonths: 12,
      mandatory: true,
      expirationRule: 'valid_until_plus_frequency',
      effectiveFrom,
      status: 'active',
      source: 'auto_seed_on_branch_create'
    });
    created += 1;
  }));

  return { created, skipped: 0, total: activeTrainings.length, reason: 'seeded' };
}

export const sucursalService = {
  // Solo para verificación de borrado (lectura) en UI legacy.
  // TODO: mover esta verificación a un método del servicio y eliminar el uso de refs en UI.
  __debugEmpleadosRef(ownerId) {
    return collection(dbAudit, ...firestoreRoutesCore.empleados(ownerId));
  },

  async listByEmpresa(ownerId, empresaId) {
    if (!ownerId) throw new Error('ownerId no disponible');
    if (!empresaId) return [];
    const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(ownerId));
    const q = query(sucursalesRef, where('empresaId', '==', empresaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => normalizeSucursal(d));
  },

  async crearSucursalCompleta(ownerId, data, user) {
    if (!ownerId) throw new Error('ownerId no disponible');
    if (!data?.empresaId) throw new Error('empresaId es requerido');
    if (!data?.nombre || !String(data.nombre).trim()) throw new Error('nombre de sucursal es requerido');

    logger.debug('[sucursalService.crearSucursalCompleta] iniciando creación', {
      ownerId,
      empresaId: data.empresaId,
      nombre: data.nombre
    });

    const actorUid = user?.uid || null;
    const actorRole = user?.role || null;

    const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(ownerId));

    logger.debug('[sucursalService.crearSucursalCompleta] creando sucursal', {
      ownerId,
      empresaId: data.empresaId,
      nombre: data.nombre,
      actorUid,
      actorRole
    });

    const payload = {
      appId: 'auditoria',
      nombre: String(data.nombre).trim(),
      direccion: data.direccion || '',
      telefono: data.telefono || '',
      horasSemanales: Number.isFinite(Number(data.horasSemanales)) ? parseInt(data.horasSemanales) : 40,
      targetMensual: Number.isFinite(Number(data.targetMensual)) ? parseInt(data.targetMensual) : 0,
      targetAnualAuditorias: Number.isFinite(Number(data.targetAnualAuditorias)) ? parseInt(data.targetAnualAuditorias) : 12,
      targetMensualCapacitaciones: Number.isFinite(Number(data.targetMensualCapacitaciones)) ? parseInt(data.targetMensualCapacitaciones) : 1,
      targetAnualCapacitaciones: Number.isFinite(Number(data.targetAnualCapacitaciones)) ? parseInt(data.targetAnualCapacitaciones) : 12,
      empresaId: data.empresaId,
      createdBy: actorUid,
      createdByRole: actorRole,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // legacy
      fechaCreacion: Timestamp.now()
    };

    const docRef = await addDocWithAppId(sucursalesRef, payload);

    // Acción del sistema (legacy helper)
    try {
      await registrarAccionSistema(
        ownerId,
        `Sucursal creada: ${payload.nombre}`,
        {
          sucursalId: docRef.id,
          nombre: payload.nombre,
          empresaId: data.empresaId,
          direccion: payload.direccion
        },
        'crear',
        'sucursal',
        docRef.id
      );
    } catch (err) {
      logger.warn('[sucursalService.crearSucursalCompleta] registrarAccionSistema falló', err);
    }

    // Side-effect crítico: reglas base de capacitación
    let seedResult = null;
    try {
      seedResult = await autoSeedTrainingRulesForBranch({
        ownerId,
        companyId: data.empresaId,
        branchId: docRef.id
      });
      logger.debug('[sucursalService.crearSucursalCompleta] autoSeedTrainingRulesForBranch', seedResult);
    } catch (err) {
      logger.warn('[sucursalService.crearSucursalCompleta] auto-seed reglas falló', err);
    }

    // Side-effect: crear plan anual del año en curso para la sucursal nueva
    try {
      const currentYear = Number(new Date().getFullYear());
      if (!Number.isFinite(currentYear) || currentYear < 2000 || currentYear > 2100) {
        throw new Error(`Invalid year: ${currentYear}`);
      }
      logger.debug('[sucursalService.crearSucursalCompleta] iniciando auto-seed de plan anual', {
        ownerId,
        branchId: docRef.id,
        companyId: data.empresaId,
        currentYear
      });
      const plan = await trainingPlanService.ensureAnnualPlan(ownerId, {
        companyId: data.empresaId,
        branchId: docRef.id,
        year: currentYear
      });
      if (!plan || !plan.id) {
        logger.error('[sucursalService.crearSucursalCompleta] plan anual no se creó (resultado vacío)', {
          branchId: docRef.id,
          planResult: plan
        });
      } else {
        logger.debug('[sucursalService.crearSucursalCompleta] plan anual asegurado exitosamente', {
          planId: plan.id,
          year: currentYear,
          branchId: docRef.id
        });
      }
    } catch (err) {
      logger.error('[sucursalService.crearSucursalCompleta] error asegurando plan anual:', {
        error: err?.message || String(err),
        stack: err?.stack,
        branchId: docRef.id
      });
    }

    return { id: docRef.id, seedResult };
  },

  async updateSucursal(ownerId, sucursalId, data, user) {
    if (!ownerId) throw new Error('ownerId no disponible');
    if (!sucursalId) throw new Error('sucursalId es requerido');
    const ref = doc(dbAudit, ...firestoreRoutesCore.sucursal(ownerId, sucursalId));
    const actorUid = user?.uid || null;

    const payload = {
      ...data,
      updatedBy: actorUid,
      updatedAt: Timestamp.now(),
      // legacy
      fechaModificacion: Timestamp.now()
    };

    logger.debug('[sucursalService.updateSucursal] actualizando sucursal', {
      ownerId,
      sucursalId,
      keys: Object.keys(data || {})
    });

    await updateDoc(ref, payload);
    return true;
  },

  async deleteSucursal(ownerId, sucursalId, user) {
    if (!ownerId) throw new Error('ownerId no disponible');
    if (!sucursalId) throw new Error('sucursalId es requerido');
    const ref = doc(dbAudit, ...firestoreRoutesCore.sucursal(ownerId, sucursalId));

    logger.debug('[sucursalService.deleteSucursal] eliminando sucursal', {
      ownerId,
      sucursalId,
      actorUid: user?.uid || null
    });

    await deleteDoc(ref);
    return true;
  },

  async countEmpleadosBySucursal(ownerId, sucursalId) {
    if (!ownerId) throw new Error('ownerId no disponible');
    if (!sucursalId) return 0;
    const empleadosRef = collection(dbAudit, ...firestoreRoutesCore.empleados(ownerId));
    const q = query(empleadosRef, where('sucursalId', '==', sucursalId));
    const snap = await getDocs(q);
    return snap.docs.length;
  }
};


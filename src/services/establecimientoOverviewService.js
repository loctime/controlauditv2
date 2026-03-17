import logger from '@/utils/logger';
import { getDocs, query, where } from 'firebase/firestore';
import { getCollectionRef } from './training/trainingBaseService';
import { normalizeEmpleado } from '../utils/firestoreUtils';

export const establecimientoOverviewService = {
  async listSucursalIdsByEmpresa(ownerId, empresaId) {
    if (!ownerId) throw new Error('ownerId no disponible');
    if (!empresaId) return [];
    const sucursalesRef = getCollectionRef(ownerId, 'sucursales');
    const snap = await getDocs(query(sucursalesRef, where('empresaId', '==', empresaId)));
    return snap.docs.map((d) => d.id);
  },

  async listEmpleadosByEmpresa(ownerId, empresaId) {
    if (!ownerId) throw new Error('ownerId no disponible');
    if (!empresaId) return [];
    const sucursalIds = await this.listSucursalIdsByEmpresa(ownerId, empresaId);
    if (sucursalIds.length === 0) return [];
    const empleadosRef = getCollectionRef(ownerId, 'empleados');
    const snap = await getDocs(query(empleadosRef, where('sucursalId', 'in', sucursalIds)));
    return snap.docs.map((d) => normalizeEmpleado(d));
  },

  async listCapacitacionesByEmpresa(ownerId, empresaId) {
    if (!ownerId) throw new Error('ownerId no disponible');
    if (!empresaId) return [];
    const sucursalIds = await this.listSucursalIdsByEmpresa(ownerId, empresaId);
    if (sucursalIds.length === 0) return [];
    const capRef = getCollectionRef(ownerId, 'capacitaciones');
    const snap = await getDocs(query(capRef, where('sucursalId', 'in', sucursalIds)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async listCapacitacionesBySucursal(ownerId, sucursalId) {
    if (!ownerId) throw new Error('ownerId no disponible');
    if (!sucursalId) return [];
    const capRef = getCollectionRef(ownerId, 'capacitaciones');
    const snap = await getDocs(query(capRef, where('sucursalId', '==', sucursalId)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data(), tipo: 'individual' }));
  },

  async listPlanesAnualesBySucursal(ownerId, sucursalId) {
    if (!ownerId) throw new Error('ownerId no disponible');
    if (!sucursalId) return [];
    try {
      const planesRef = getCollectionRef(ownerId, 'planesCapacitacionesAnuales');
      const snap = await getDocs(query(planesRef, where('sucursalId', '==', sucursalId)));
      return snap.docs.map((d) => ({ id: d.id, ...d.data(), tipo: 'plan_anual' }));
    } catch (err) {
      logger.debug('[establecimientoOverviewService] listPlanesAnualesBySucursal error', err);
      return [];
    }
  }
};


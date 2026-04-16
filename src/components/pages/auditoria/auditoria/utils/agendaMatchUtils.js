import logger from '@/utils/logger';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { dbAudit } from '../../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../../core/firestore/firestoreRoutes.core';

const VENTANA_DIAS = 7;

const normalizar = (v) => (v == null ? '' : String(v).trim().toLowerCase());

export const buscarAgendasMatch = async ({ ownerId, empresaId, empresaNombre, sucursal, formularioId }) => {
  if (!ownerId || !formularioId || !sucursal || !(empresaId || empresaNombre)) {
    return [];
  }

  try {
    const agendaRef = collection(dbAudit, ...firestoreRoutesCore.auditorias_agendadas(ownerId));
    const q = query(agendaRef, where('estado', '==', 'agendada'));
    const snap = await getDocs(q);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - VENTANA_DIAS);
    const hasta = new Date(hoy);
    hasta.setDate(hoy.getDate() + VENTANA_DIAS);

    const empresaIdNorm = normalizar(empresaId);
    const empresaNombreNorm = normalizar(empresaNombre);
    const sucursalNorm = normalizar(sucursal);
    const formularioIdNorm = normalizar(formularioId);

    const matches = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((a) => {
        if (!a.fecha) return false;
        const fechaAgenda = new Date(`${a.fecha}T00:00:00`);
        if (Number.isNaN(fechaAgenda.getTime())) return false;
        if (fechaAgenda < desde || fechaAgenda > hasta) return false;

        const matchFormulario = normalizar(a.formularioId) === formularioIdNorm;
        if (!matchFormulario) return false;

        const matchSucursal = normalizar(a.sucursal) === sucursalNorm;
        if (!matchSucursal) return false;

        const agendaEmpresaId = normalizar(a.empresaId);
        const agendaEmpresaNombre = normalizar(a.empresa);
        const matchEmpresa =
          (empresaIdNorm && agendaEmpresaId && agendaEmpresaId === empresaIdNorm) ||
          (empresaNombreNorm && agendaEmpresaNombre && agendaEmpresaNombre === empresaNombreNorm);

        return matchEmpresa;
      })
      .sort((a, b) => {
        const diffA = Math.abs(new Date(`${a.fecha}T00:00:00`) - hoy);
        const diffB = Math.abs(new Date(`${b.fecha}T00:00:00`) - hoy);
        return diffA - diffB;
      });

    return matches;
  } catch (error) {
    logger.debug('[agendaMatchUtils] Error buscando matches:', error);
    return [];
  }
};

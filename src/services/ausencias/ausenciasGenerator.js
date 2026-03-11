import {
  collection,
  getDocs,
  limit,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';
import {
  appendAusenciaHistorial,
  createAusencia,
  findOpenAusenciaByEmpleado,
  updateAusencia
} from '../ausenciasService';

const AUTO_ORIGEN = {
  accidente: 'accidente',
  incidente: 'incidente',
  salud: 'salud_ocupacional'
};

const isClosed = (estado) => {
  const normalized = String(estado || '').toLowerCase().trim();
  return normalized.includes('cerr') || normalized.includes('finaliz') || normalized.includes('resuelt');
};

const getOwnerId = (userProfile) => {
  if (!userProfile?.ownerId) {
    throw new Error('userProfile.ownerId es requerido');
  }
  return userProfile.ownerId;
};

const ensureRequired = (payload = {}, keys = []) => {
  keys.forEach((key) => {
    const value = payload[key];
    if (value === undefined || value === null || String(value).trim() === '') {
      throw new Error(`${key} es requerido para generar ausencia automatica`);
    }
  });
};

const findActiveByDedupeKey = async ({ ownerId, sucursalId, dedupeKey }) => {
  if (!ownerId || !sucursalId || !dedupeKey) return null;

  const ausenciasRef = collection(db, ...firestoreRoutesCore.ausencias(ownerId));
  const snapshot = await getDocs(
    query(
      ausenciasRef,
      where('sucursalId', '==', String(sucursalId)),
      where('dedupeKey', '==', String(dedupeKey)),
      limit(10)
    )
  );

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data() || {};
    if (!isClosed(data.estado || data.status)) {
      return {
        id: docSnapshot.id,
        ...data
      };
    }
  }

  return null;
};

const buildAutoEvent = ({ origen, origenId, detalle }, userProfile) => ({
  tipo: 'auto_creada',
  detalle: detalle || 'Ausencia creada automaticamente por evento origen',
  origen,
  origenId,
  estado: 'abierta',
  usuario: userProfile?.uid || null
});

const buildAutoUpdateEvent = ({ origen, origenId, detalle }, userProfile) => ({
  tipo: 'auto_actualizada',
  detalle: detalle || 'Ausencia actualizada automaticamente por certificado',
  origen,
  origenId,
  usuario: userProfile?.uid || null
});

export async function createAusenciaFromAccidente(input = {}, userProfile) {
  getOwnerId(userProfile);
  ensureRequired(input, ['accidenteId', 'empleadoId', 'empresaId', 'sucursalId']);

  const dedupeKey = `accidente:${input.accidenteId}:empleado:${input.empleadoId}`;
  const existing = await findActiveByDedupeKey({
    ownerId: userProfile.ownerId,
    sucursalId: input.sucursalId,
    dedupeKey
  });

  if (existing) {
    return {
      ausenciaId: existing.id,
      created: false,
      reason: 'duplicate'
    };
  }

  try {
    const ausencia = await createAusencia({
      empresaId: input.empresaId,
      empresaNombre: input.empresaNombre || null,
      sucursalId: input.sucursalId,
      sucursalNombre: input.sucursalNombre || null,
      empleadoId: input.empleadoId,
      empleadoNombre: input.empleadoNombre || null,
      tipo: input.tipo || 'accidente',
      motivo: input.motivo || 'Reposo por accidente',
      origen: AUTO_ORIGEN.accidente,
      origenId: String(input.accidenteId),
      dedupeKey,
      estado: 'abierta',
      fechaInicio: input.fechaInicio || new Date(),
      fechaFin: null,
      observaciones: input.observaciones || '',
      userProfile
    });

    await appendAusenciaHistorial(
      ausencia.id,
      buildAutoEvent(
        {
          origen: AUTO_ORIGEN.accidente,
          origenId: String(input.accidenteId),
          detalle: 'Ausencia creada automaticamente desde accidente con reposo'
        },
        userProfile
      ),
      userProfile
    );

    return {
      ausenciaId: ausencia.id,
      created: true,
      reason: null
    };
  } catch (error) {
    if (error?.code === 'AUSENCIA_DUPLICADA') {
      const duplicate = await findActiveByDedupeKey({
        ownerId: userProfile.ownerId,
        sucursalId: input.sucursalId,
        dedupeKey
      });
      return {
        ausenciaId: duplicate?.id || null,
        created: false,
        reason: 'duplicate'
      };
    }
    throw error;
  }
}

export async function createAusenciaFromIncidente(input = {}, userProfile) {
  getOwnerId(userProfile);

  if (!input.tieneLesion || !input.empleadoId) {
    return {
      ausenciaId: null,
      created: false,
      reason: 'not_applicable'
    };
  }

  ensureRequired(input, ['incidenteId', 'empleadoId', 'empresaId', 'sucursalId']);

  const dedupeKey = `incidente:${input.incidenteId}:empleado:${input.empleadoId}`;
  const existing = await findActiveByDedupeKey({
    ownerId: userProfile.ownerId,
    sucursalId: input.sucursalId,
    dedupeKey
  });

  if (existing) {
    return {
      ausenciaId: existing.id,
      created: false,
      reason: 'duplicate'
    };
  }

  try {
    const ausencia = await createAusencia({
      empresaId: input.empresaId,
      empresaNombre: input.empresaNombre || null,
      sucursalId: input.sucursalId,
      sucursalNombre: input.sucursalNombre || null,
      empleadoId: input.empleadoId,
      empleadoNombre: input.empleadoNombre || null,
      tipo: input.tipo || 'incidente',
      motivo: input.motivo || 'Lesion por incidente',
      origen: AUTO_ORIGEN.incidente,
      origenId: String(input.incidenteId),
      dedupeKey,
      estado: 'abierta',
      fechaInicio: input.fechaInicio || new Date(),
      fechaFin: null,
      observaciones: input.observaciones || '',
      userProfile
    });

    await appendAusenciaHistorial(
      ausencia.id,
      buildAutoEvent(
        {
          origen: AUTO_ORIGEN.incidente,
          origenId: String(input.incidenteId),
          detalle: 'Ausencia creada automaticamente desde incidente con lesion'
        },
        userProfile
      ),
      userProfile
    );

    return {
      ausenciaId: ausencia.id,
      created: true,
      reason: null
    };
  } catch (error) {
    if (error?.code === 'AUSENCIA_DUPLICADA') {
      const duplicate = await findActiveByDedupeKey({
        ownerId: userProfile.ownerId,
        sucursalId: input.sucursalId,
        dedupeKey
      });
      return {
        ausenciaId: duplicate?.id || null,
        created: false,
        reason: 'duplicate'
      };
    }
    throw error;
  }
}

export async function createOrUpdateAusenciaFromCertificado(input = {}, userProfile) {
  getOwnerId(userProfile);
  ensureRequired(input, ['certificadoId', 'empleadoId', 'empresaId', 'sucursalId', 'fechaInicio']);

  const origen = AUTO_ORIGEN.salud;
  const origenId = String(input.certificadoId);
  const openAusencia = await findOpenAusenciaByEmpleado({
    empleadoId: input.empleadoId,
    sucursalId: input.sucursalId,
    userProfile
  });

  if (openAusencia?.id) {
    await updateAusencia(
      openAusencia.id,
      {
        fechaFin: input.fechaFin || null,
        motivo: input.motivo || openAusencia.motivo || 'Certificado medico',
        origen,
        origenId
      },
      userProfile
    );

    await appendAusenciaHistorial(
      openAusencia.id,
      buildAutoUpdateEvent(
        {
          origen,
          origenId,
          detalle: 'Ausencia abierta actualizada automaticamente por certificado medico'
        },
        userProfile
      ),
      userProfile
    );

    return {
      ausenciaId: openAusencia.id,
      created: false,
      updated: true,
      reason: 'updated_open'
    };
  }

  const dedupeKey = `certificado:${input.certificadoId}:empleado:${input.empleadoId}`;
  const existing = await findActiveByDedupeKey({
    ownerId: userProfile.ownerId,
    sucursalId: input.sucursalId,
    dedupeKey
  });

  if (existing) {
    return {
      ausenciaId: existing.id,
      created: false,
      updated: false,
      reason: 'duplicate'
    };
  }

  const ausencia = await createAusencia({
    empresaId: input.empresaId,
    empresaNombre: input.empresaNombre || null,
    sucursalId: input.sucursalId,
    sucursalNombre: input.sucursalNombre || null,
    empleadoId: input.empleadoId,
    empleadoNombre: input.empleadoNombre || null,
    tipo: input.tipo || 'salud_ocupacional',
    motivo: input.motivo || 'Certificado medico',
    origen,
    origenId,
    dedupeKey,
    estado: 'abierta',
    fechaInicio: input.fechaInicio,
    fechaFin: input.fechaFin || null,
    observaciones: input.observaciones || '',
    userProfile
  });

  await appendAusenciaHistorial(
    ausencia.id,
    buildAutoEvent(
      {
        origen,
        origenId,
        detalle: 'Ausencia creada automaticamente desde certificado medico'
      },
      userProfile
    ),
    userProfile
  );

  return {
    ausenciaId: ausencia.id,
    created: true,
    updated: false,
    reason: null
  };
}

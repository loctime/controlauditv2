import logger from '@/utils/logger';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
  doc,
  arrayUnion
} from "firebase/firestore";
import { db } from "../firebaseControlFile";
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { addDocWithAppId, updateDocWithAppId } from "../firebase/firestoreAppWriter";

const CHUNK_SIZE = 10;
const ORIGEN_VALUES = [
  'manual',
  'accidente',
  'incidente',
  'salud_ocupacional',
  'licencia_medica',
  'permiso',
  'enfermedad'
];
const STATUS_VALUES = ['abierta', 'en_progreso', 'cerrada'];

const toTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return Timestamp.fromDate(parsed);
    }
  }
  if (value?.toDate) {
    return value;
  }
  return null;
};

const normalizeDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value?.toDate) {
    try {
      return value.toDate();
    } catch (_error) {
      return null;
    }
  }
  return null;
};

const normalizeDateStart = (value) => {
  const date = normalizeDate(value);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const normalizeEstado = (estado) => {
  const status = String(estado || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (!status) return 'abierta';
  if (
    status.includes('cerr') ||
    status.includes('finaliz') ||
    status.includes('resuelt')
  ) {
    return 'cerrada';
  }
  if (status.includes('progreso')) {
    return 'en_progreso';
  }
  if (status === 'abierto') return 'abierta';
  if (STATUS_VALUES.includes(status)) return status;
  return 'abierta';
};

const isClosedStatus = (estado) => normalizeEstado(estado) === 'cerrada';

const buildHistorialEvent = (evento = {}, userProfile) => ({
  tipo: evento.tipo || 'actualizacion',
  detalle: evento.detalle || '',
  estado: evento.estado || null,
  by: userProfile?.uid || null,
  at: Timestamp.now()
});

const normalizeOrigen = (origen, relacionAccidente) => {
  const candidate = String(origen || '').toLowerCase().trim();
  if (ORIGEN_VALUES.includes(candidate)) return candidate;
  if (typeof relacionAccidente === 'string' && relacionAccidente.trim()) {
    return 'accidente';
  }
  if (relacionAccidente === true) return 'accidente';
  return 'manual';
};

const normalizeOrigenId = ({ origen, origenId, relacionAccidente }) => {
  if (origen === 'manual') return null;
  const normalized = String(origenId || '').trim();
  if (normalized) return normalized;
  if (typeof relacionAccidente === 'string' && relacionAccidente.trim()) {
    return relacionAccidente.trim();
  }
  return null;
};

const normalizeMotivo = (motivo, fallbackTipo = null) => {
  const normalized = String(motivo || '').trim();
  if (normalized) return normalized;
  const fallback = String(fallbackTipo || '').trim();
  return fallback || 'Sin motivo';
};

const formatDateKey = (value) => {
  const date = normalizeDateStart(value);
  if (!date) return 'sin-fecha';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const buildAusenciaDedupeKey = ({
  empleadoId,
  origen,
  origenId,
  fechaInicio
}) => {
  const empleadoKey = String(empleadoId || 'sin-empleado').trim();
  const origenKey = String(origen || 'manual').trim() || 'manual';
  const origenIdKey = String(origenId || 'manual').trim() || 'manual';
  const fechaKey = formatDateKey(fechaInicio);
  return `${empleadoKey}|${origenKey}|${origenIdKey}|${fechaKey}`;
};

const normalizeAusenciaRecord = (record = {}, id = null) => {
  const estado = normalizeEstado(record.estado || record.status);
  const origen = normalizeOrigen(record.origen, record.relacionAccidente);
  const origenId = normalizeOrigenId({
    origen,
    origenId: record.origenId,
    relacionAccidente: record.relacionAccidente
  });
  const motivo = normalizeMotivo(record.motivo, record.tipo);
  const dedupeKey =
    String(record.dedupeKey || '').trim() ||
    buildAusenciaDedupeKey({
      empleadoId: record.empleadoId,
      origen,
      origenId,
      fechaInicio: record.fechaInicio || record.createdAt
    });

  return {
    ...(id ? { id } : {}),
    ...record,
    estado,
    origen,
    origenId,
    motivo,
    dedupeKey,
    filesCount:
      typeof record.filesCount === 'number' ? Math.max(0, record.filesCount) : 0
  };
};

const mapAusenciaDoc = (docSnapshot) =>
  normalizeAusenciaRecord(docSnapshot.data(), docSnapshot.id);

export const computeDiasAusente = (fechaInicio, fechaFin = null, now = new Date()) => {
  const inicio = normalizeDateStart(fechaInicio);
  if (!inicio) return 0;

  const finReferencia = fechaFin || now;
  const fin = normalizeDateStart(finReferencia);
  if (!fin) return 1;
  if (fin < inicio) return 1;

  const diffDays = Math.floor((fin.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, diffDays);
};

const isRecordClosed = (record = {}) =>
  normalizeEstado(record.estado || record.status) === 'cerrada';

const ensureNoActiveDuplicate = async ({
  ownerId,
  sucursalId,
  dedupeKey,
  excludeAusenciaId = null
}) => {
  if (!ownerId || !sucursalId || !dedupeKey) return;

  const ausenciasRef = collection(db, ...firestoreRoutesCore.ausencias(ownerId));
  const duplicateQuery = query(
    ausenciasRef,
    where('sucursalId', '==', sucursalId),
    where('dedupeKey', '==', dedupeKey),
    limit(10)
  );
  const snapshot = await getDocs(duplicateQuery);

  const hasActiveDuplicate = snapshot.docs.some((duplicateDoc) => {
    if (excludeAusenciaId && duplicateDoc.id === excludeAusenciaId) return false;
    return !isRecordClosed(duplicateDoc.data());
  });

  if (hasActiveDuplicate) {
    const error = new Error('Ya existe una ausencia activa con el mismo dedupeKey.');
    error.code = 'AUSENCIA_DUPLICADA';
    throw error;
  }
};

const filterByDateRange = (records, startDate, endDate) => {
  if (!startDate && !endDate) return records;
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  return records.filter((record) => {
    const startRecord =
      normalizeDate(record.fechaInicio) || normalizeDate(record.createdAt);
    const endRecord =
      normalizeDate(record.fechaFin) ||
      normalizeDate(record.updatedAt) ||
      new Date();

    if (!startRecord) return false;

    if (start && end) {
      return startRecord <= end && endRecord >= start;
    }
    if (start) {
      return endRecord >= start;
    }
    if (end) {
      return startRecord <= end;
    }
    return true;
  });
};

const filterByTipoEstadoOrigen = (records, tipo, estado, origen = 'todos') => {
  let filtered = records;
  if (tipo && tipo !== 'todos') {
    const tipoLower = String(tipo).toLowerCase();
    filtered = filtered.filter((record) => {
      const recordTipo =
        record.tipo ||
        record.categoria ||
        record.clasificacion ||
        record.etiqueta ||
        '';
      return String(recordTipo).toLowerCase() === tipoLower;
    });
  }

  if (estado && estado !== 'todos') {
    filtered = filtered.filter((record) => {
      const status = normalizeEstado(record.estado || record.status || 'abierta');
      if (estado === 'activas') {
        return status !== 'cerrada';
      }
      if (estado === 'cerradas') {
        return status === 'cerrada';
      }
      return status === normalizeEstado(estado);
    });
  }

  if (origen && origen !== 'todos') {
    const origenLower = String(origen).toLowerCase();
    filtered = filtered.filter(
      (record) => (record.origen || 'manual').toLowerCase() === origenLower
    );
  }

  return filtered;
};

export async function listAusencias({
  empresaId,
  sucursalId,
  sucursales = [],
  startDate,
  endDate,
  tipo = 'todos',
  estado = 'todos',
  origen = 'todos',
  search = '',
  userProfile
}) {
  try {
    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const ausenciasRef = collection(db, ...firestoreRoutesCore.ausencias(ownerId));
    const results = [];

    const fetchByQuery = async (consulta) => {
      const snapshot = await getDocs(consulta);
      snapshot.forEach((docSnapshot) => {
        results.push(mapAusenciaDoc(docSnapshot));
      });
    };

    if (sucursalId && sucursalId !== 'todas') {
      const q = query(
        ausenciasRef,
        where('sucursalId', '==', sucursalId),
        orderBy('fechaInicio', 'desc')
      );
      await fetchByQuery(q);
    } else if (Array.isArray(sucursales) && sucursales.length > 0) {
      for (let i = 0; i < sucursales.length; i += CHUNK_SIZE) {
        const chunk = sucursales.slice(i, i + CHUNK_SIZE);
        const validIds = chunk.map((sucursal) => sucursal.id).filter(Boolean);
        if (validIds.length === 0) continue;
        const q = query(
          ausenciasRef,
          where('sucursalId', 'in', validIds),
          orderBy('fechaInicio', 'desc')
        );
        await fetchByQuery(q);
      }
    } else if (empresaId) {
      const q = query(
        ausenciasRef,
        where('empresaId', '==', empresaId),
        orderBy('fechaInicio', 'desc')
      );
      await fetchByQuery(q);
    } else {
      const q = query(ausenciasRef, orderBy('fechaInicio', 'desc'), limit(200));
      await fetchByQuery(q);
    }

    let filtered = filterByDateRange(results, startDate, endDate);
    filtered = filterByTipoEstadoOrigen(filtered, tipo, estado, origen);

    if (search) {
      const needle = search.toLowerCase();
      filtered = filtered.filter((record) => {
        return (
          (record.empleadoNombre || '').toLowerCase().includes(needle) ||
          (record.observaciones || '').toLowerCase().includes(needle) ||
          (record.motivo || '').toLowerCase().includes(needle) ||
          (record.tipo || '').toLowerCase().includes(needle) ||
          (record.origen || '').toLowerCase().includes(needle) ||
          String(record.origenId || '').toLowerCase().includes(needle)
        );
      });
    }

    filtered = filtered.map((record) => {
      const normalizedRecord = normalizeAusenciaRecord(record, record.id);
      const cerrado = isClosedStatus(normalizedRecord.estado);
      const diasPersistidos =
        typeof normalizedRecord.diasAusente === 'number' && normalizedRecord.diasAusente > 0
          ? normalizedRecord.diasAusente
          : null;

      const diasAusente = cerrado
        ? diasPersistidos ||
          computeDiasAusente(
            normalizedRecord.fechaInicio || normalizedRecord.createdAt,
            normalizedRecord.fechaFin || null
          )
        : computeDiasAusente(normalizedRecord.fechaInicio || normalizedRecord.createdAt, null);

      return {
        ...normalizedRecord,
        diasAusente
      };
    });

    filtered.sort((a, b) => {
      const fechaA =
        normalizeDate(a.fechaInicio) ||
        normalizeDate(a.createdAt) ||
        new Date(0);
      const fechaB =
        normalizeDate(b.fechaInicio) ||
        normalizeDate(b.createdAt) ||
        new Date(0);
      return fechaB - fechaA;
    });

    return filtered;
  } catch (error) {
    logger.error('[ausenciasService] Error listando ausencias:', error);
    return [];
  }
}

export async function getAusenciaById(ausenciaId, userProfile) {
  if (!ausenciaId) throw new Error('ausenciaId es requerido');
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

  const ownerId = userProfile.ownerId;
  const docRef = doc(db, ...firestoreRoutesCore.ausencia(ownerId, ausenciaId));
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;
  return normalizeAusenciaRecord(snapshot.data(), snapshot.id);
}


export async function findOpenAusenciaByEmpleado({
  empleadoId,
  sucursalId = null,
  userProfile
}) {
  if (!empleadoId) return null;
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

  const ownerId = userProfile.ownerId;
  const ausenciasRef = collection(db, ...firestoreRoutesCore.ausencias(ownerId));
  const snapshot = await getDocs(
    query(
      ausenciasRef,
      where('empleadoId', '==', String(empleadoId)),
      where('estado', 'in', ['abierta', 'en_progreso']),
      orderBy('fechaInicio', 'desc'),
      limit(20)
    )
  );

  for (const docSnapshot of snapshot.docs) {
    const record = normalizeAusenciaRecord(docSnapshot.data(), docSnapshot.id);
    if (sucursalId && String(record.sucursalId || '') !== String(sucursalId)) {
      continue;
    }
    if (!isClosedStatus(record.estado)) {
      return record;
    }
  }
  return null;
}
export async function appendAusenciaHistorial(ausenciaId, evento = {}, userProfile) {
  if (!ausenciaId) throw new Error('ausenciaId es requerido');
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

  const ownerId = userProfile.ownerId;
  const docRef = doc(db, ...firestoreRoutesCore.ausencia(ownerId, ausenciaId));
  const historialEvent = buildHistorialEvent(evento, userProfile);

  await updateDocWithAppId(docRef, {
    historial: arrayUnion(historialEvent),
    updatedAt: serverTimestamp()
  });
}


export async function createOrUpdateAusenciaFromCertificado(input = {}, userProfile) {
  const generator = await import('./ausencias/ausenciasGenerator');
  return generator.createOrUpdateAusenciaFromCertificado(input, userProfile);
}
export async function createAusencia({
  empresaId,
  sucursalId,
  empresaNombre,
  sucursalNombre,
  empleadoId,
  empleadoNombre,
  tipo,
  motivo,
  origen = 'manual',
  origenId = null,
  dedupeKey = null,
  estado,
  fechaInicio,
  fechaFin,
  observaciones,
  horasPorDia,
  relacionAccidente = null,
  diasLaborales = null,
  horasSemanales = null,
  userProfile
}) {
  if (!userProfile?.uid) {
    throw new Error('userProfile.ownerId es requerido para crear ausencia');
  }
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

  const ownerId = userProfile.ownerId;
  const estadoNormalizado = normalizeEstado(estado || 'abierta');
  const origenNormalizado = normalizeOrigen(origen, relacionAccidente);
  const origenIdNormalizado = normalizeOrigenId({
    origen: origenNormalizado,
    origenId,
    relacionAccidente
  });
  const motivoNormalizado = normalizeMotivo(motivo, tipo);
  const dedupeKeyNormalizado =
    String(dedupeKey || '').trim() ||
    buildAusenciaDedupeKey({
      empleadoId,
      origen: origenNormalizado,
      origenId: origenIdNormalizado,
      fechaInicio
    });

  const diasAusente = isClosedStatus(estadoNormalizado)
    ? computeDiasAusente(fechaInicio, fechaFin)
    : computeDiasAusente(fechaInicio, null);

  await ensureNoActiveDuplicate({
    ownerId,
    sucursalId,
    dedupeKey: dedupeKeyNormalizado
  });

  const payload = {
    empresaId: empresaId || null,
    empresaNombre: empresaNombre || null,
    sucursalId: sucursalId || null,
    sucursalNombre: sucursalNombre || null,
    empleadoId: empleadoId || null,
    empleadoNombre: empleadoNombre || null,
    tipo: tipo || 'enfermedad',
    motivo: motivoNormalizado,
    origen: origenNormalizado,
    origenId: origenIdNormalizado,
    dedupeKey: dedupeKeyNormalizado,
    estado: estadoNormalizado,
    fechaInicio: toTimestamp(fechaInicio) || serverTimestamp(),
    fechaFin: toTimestamp(fechaFin),
    diasAusente,
    observaciones: observaciones || '',
    horasPorDia: typeof horasPorDia === 'number' ? horasPorDia : null,
    horasSemanales:
      typeof horasSemanales === 'number' ? horasSemanales : null,
    diasLaborales: typeof diasLaborales === 'number' ? diasLaborales : null,
    relacionAccidente: relacionAccidente || null,
    filesCount: 0,
    lastFileAt: null,
    historial: [
      buildHistorialEvent(
        {
          tipo: 'created',
          detalle: 'Ausencia registrada',
          estado: estadoNormalizado
        },
        userProfile
      )
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const ausenciasRef = collection(db, ...firestoreRoutesCore.ausencias(ownerId));
  const docRef = await addDocWithAppId(ausenciasRef, payload);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? mapAusenciaDoc(snapshot) : { id: docRef.id, ...payload };
}

export async function updateAusencia(ausenciaId, changes = {}, userProfile) {
  if (!ausenciaId) return;
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido para actualizar ausencia');
  const ownerId = userProfile.ownerId;
  const docRef = doc(db, ...firestoreRoutesCore.ausencia(ownerId, ausenciaId));
  const currentSnapshot = await getDoc(docRef);
  const currentData = currentSnapshot.exists() ? currentSnapshot.data() : {};

  const payload = {
    ...changes,
    updatedAt: serverTimestamp()
  };

  if (Object.prototype.hasOwnProperty.call(changes, 'fechaInicio')) {
    payload.fechaInicio = toTimestamp(changes.fechaInicio);
  }
  if (Object.prototype.hasOwnProperty.call(changes, 'fechaFin')) {
    payload.fechaFin = toTimestamp(changes.fechaFin);
  }
  if (Object.prototype.hasOwnProperty.call(changes, 'estado')) {
    payload.estado = normalizeEstado(changes.estado);
  }

  const nextEstado = normalizeEstado(changes.estado ?? currentData.estado ?? 'abierta');
  const prevEstado = normalizeEstado(currentData.estado ?? 'abierta');
  const nextFechaInicio =
    Object.prototype.hasOwnProperty.call(changes, 'fechaInicio')
      ? changes.fechaInicio
      : currentData.fechaInicio;
  const nextFechaFin =
    Object.prototype.hasOwnProperty.call(changes, 'fechaFin')
      ? changes.fechaFin
      : currentData.fechaFin;

  const nextOrigen = normalizeOrigen(
    changes.origen ?? currentData.origen,
    changes.relacionAccidente ?? currentData.relacionAccidente
  );
  const nextOrigenId = normalizeOrigenId({
    origen: nextOrigen,
    origenId: changes.origenId ?? currentData.origenId,
    relacionAccidente: changes.relacionAccidente ?? currentData.relacionAccidente
  });
  const nextMotivo = normalizeMotivo(changes.motivo ?? currentData.motivo, changes.tipo ?? currentData.tipo);
  const nextDedupeKey = buildAusenciaDedupeKey({
    empleadoId: changes.empleadoId ?? currentData.empleadoId,
    origen: nextOrigen,
    origenId: nextOrigenId,
    fechaInicio: nextFechaInicio
  });

  payload.origen = nextOrigen;
  payload.origenId = nextOrigenId;
  payload.motivo = nextMotivo;
  payload.dedupeKey = nextDedupeKey;

  payload.diasAusente = isClosedStatus(nextEstado)
    ? computeDiasAusente(nextFechaInicio, nextFechaFin)
    : computeDiasAusente(nextFechaInicio, null);

  await ensureNoActiveDuplicate({
    ownerId,
    sucursalId: changes.sucursalId ?? currentData.sucursalId,
    dedupeKey: nextDedupeKey,
    excludeAusenciaId: ausenciaId
  });

  if (nextEstado !== prevEstado) {
    payload.historial = arrayUnion(
      buildHistorialEvent(
        {
          tipo: 'status_changed',
          detalle: `Estado actualizado de ${prevEstado} a ${nextEstado}`,
          estado: nextEstado
        },
        userProfile
      )
    );
  }

  await updateDocWithAppId(docRef, payload);
}

export async function updateAusenciaEstado(ausenciaId, estado, userProfile, options = {}) {
  if (!ausenciaId) throw new Error('ausenciaId es requerido');
  if (!estado) throw new Error('estado es requerido');

  const estadoNormalizado = normalizeEstado(estado);
  const changes = { estado: estadoNormalizado };
  if (isClosedStatus(estadoNormalizado) && !options.keepFechaFin) {
    changes.fechaFin = options.fechaFin || new Date();
  }

  if (!isClosedStatus(estadoNormalizado) && options.clearFechaFin) {
    changes.fechaFin = null;
  }

  await updateAusencia(ausenciaId, changes, userProfile);
}

export async function cerrarAusencia(ausenciaId, { fechaFin = new Date() } = {}, userProfile) {
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido para cerrar ausencia');
  const ownerId = userProfile.ownerId;
  const docRef = doc(db, ...firestoreRoutesCore.ausencia(ownerId, ausenciaId));
  const currentSnapshot = await getDoc(docRef);
  const currentData = currentSnapshot.exists() ? currentSnapshot.data() : {};
  const diasAusente = computeDiasAusente(currentData.fechaInicio || null, fechaFin);

  await updateDocWithAppId(docRef, {
    estado: 'cerrada',
    fechaFin: toTimestamp(fechaFin),
    diasAusente,
    historial: arrayUnion(
      buildHistorialEvent(
        {
          tipo: 'closed',
          detalle: 'Ausencia cerrada',
          estado: 'cerrada'
        },
        userProfile
      )
    ),
    updatedAt: serverTimestamp()
  });
}

export const AUSENCIA_ESTADOS = [
  { value: 'abierta', label: 'Abierta' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'cerrada', label: 'Cerrada' }
];

export async function getAusenciaTipos({ maxResults = 200 } = {}, userProfile) {
  try {
    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const ausenciasRef = collection(db, ...firestoreRoutesCore.ausencias(ownerId));
    const consulta = query(ausenciasRef, orderBy('tipo', 'asc'), limit(maxResults));
    const snapshot = await getDocs(consulta);
    const unique = new Set();
    snapshot.forEach((docSnapshot) => {
      const tipo = docSnapshot.data()?.tipo;
      if (typeof tipo === 'string' && tipo.trim()) {
        unique.add(tipo.trim());
      }
    });
    return Array.from(unique);
  } catch (error) {
    logger.error('Error obteniendo tipos de ausencias:', error);
    return [];
  }
}









import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
  doc
} from "firebase/firestore";
import { db } from "../firebaseControlFile";
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { addDocWithAppId, updateDocWithAppId } from "../firebase/firestoreAppWriter";

const AUSENCIAS_COLLECTION = "ausencias";
const CHUNK_SIZE = 10;

const mapAusenciaDoc = (docSnapshot) => {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    ...data
  };
};

const toTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return Timestamp.fromDate(parsed);
    }
  }
  if (value.toDate) {
    return value;
  }
  return null;
};

const normalizeDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value?.toDate) {
    try {
      return value.toDate();
    } catch (error) {
      return null;
    }
  }
  return null;
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

const filterByTipoEstado = (records, tipo, estado) => {
  let filtered = records;
  if (tipo && tipo !== "todos") {
    filtered = filtered.filter((record) => {
      const recordTipo =
        record.tipo ||
        record.categoria ||
        record.clasificacion ||
        record.etiqueta ||
        "";
      return recordTipo.toLowerCase().includes(tipo.toLowerCase());
    });
  }
  if (estado && estado !== "todos") {
    filtered = filtered.filter((record) => {
      const status = (record.estado || record.status || "abierto").toLowerCase();
      if (estado === "activas") {
        return status !== "cerrada" && status !== "cerrado";
      }
      if (estado === "cerradas") {
        return status === "cerrada" || status === "cerrado" || status === "finalizado" || status === "finalizada";
      }
      return status === estado;
    });
  }
  return filtered;
};

export async function listAusencias({
  empresaId,
  sucursalId,
  sucursales = [],
  startDate,
  endDate,
  tipo = "todos",
  estado = "todos",
  search = "",
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

    if (sucursalId && sucursalId !== "todas") {
      const q = query(
        ausenciasRef,
        where("sucursalId", "==", sucursalId),
        orderBy("fechaInicio", "desc")
      );
      await fetchByQuery(q);
    } else if (Array.isArray(sucursales) && sucursales.length > 0) {
      for (let i = 0; i < sucursales.length; i += CHUNK_SIZE) {
        const chunk = sucursales.slice(i, i + CHUNK_SIZE);
        const validIds = chunk.map((sucursal) => sucursal.id).filter(Boolean);
        if (validIds.length === 0) continue;
        const q = query(
          ausenciasRef,
          where("sucursalId", "in", validIds),
          orderBy("fechaInicio", "desc")
        );
        await fetchByQuery(q);
      }
    } else if (empresaId) {
      const q = query(
        ausenciasRef,
        where("empresaId", "==", empresaId),
        orderBy("fechaInicio", "desc")
      );
      await fetchByQuery(q);
    } else {
      const q = query(ausenciasRef, orderBy("fechaInicio", "desc"), limit(200));
      await fetchByQuery(q);
    }

    let filtered = filterByDateRange(results, startDate, endDate);
    filtered = filterByTipoEstado(filtered, tipo, estado);

    if (search) {
      const needle = search.toLowerCase();
      filtered = filtered.filter((record) => {
        return (
          (record.empleadoNombre || "")
            .toLowerCase()
            .includes(needle) ||
          (record.observaciones || "")
            .toLowerCase()
            .includes(needle) ||
          (record.tipo || "")
            .toLowerCase()
            .includes(needle)
        );
      });
    }

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
    console.error("❌ [ausenciasService] Error listando ausencias:", error);
    return [];
  }
}

export async function createAusencia({
  empresaId,
  sucursalId,
  empresaNombre,
  sucursalNombre,
  empleadoId,
  empleadoNombre,
  tipo,
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
  const payload = {
    empresaId: empresaId || null,
    empresaNombre: empresaNombre || null,
    sucursalId: sucursalId || null,
    sucursalNombre: sucursalNombre || null,
    empleadoId: empleadoId || null,
    empleadoNombre: empleadoNombre || null,
    tipo: tipo || "enfermedad",
    estado: estado || "abierto",
    fechaInicio: toTimestamp(fechaInicio) || serverTimestamp(),
    fechaFin: toTimestamp(fechaFin),
    observaciones: observaciones || "",
    horasPorDia: typeof horasPorDia === "number" ? horasPorDia : null,
    horasSemanales:
      typeof horasSemanales === "number" ? horasSemanales : null,
    diasLaborales: typeof diasLaborales === "number" ? diasLaborales : null,
    relacionAccidente: relacionAccidente || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
  const ownerId = userProfile.ownerId;
  const ausenciasRef = collection(db, ...firestoreRoutesCore.ausencias(ownerId));
  const docRef = await addDocWithAppId(ausenciasRef, payload);
  const snapshot = await getDocs(
    query(
      ausenciasRef,
      where("__name__", "==", docRef.id)
    )
  );

  const created = snapshot.docs[0];
  return created ? mapAusenciaDoc(created) : { id: docRef.id, ...payload };
}

export async function updateAusencia(ausenciaId, changes = {}, userProfile) {
  if (!ausenciaId) return;
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido para actualizar ausencia');
  const ownerId = userProfile.ownerId;
  const docRef = doc(db, ...firestoreRoutesCore.ausencias(ownerId), ausenciaId);
  const payload = {
    ...changes,
    updatedAt: serverTimestamp()
  };
  if (changes.fechaInicio) {
    payload.fechaInicio = toTimestamp(changes.fechaInicio);
  }
  if (Object.prototype.hasOwnProperty.call(changes, "fechaFin")) {
    payload.fechaFin = toTimestamp(changes.fechaFin);
  }
  await updateDocWithAppId(docRef, payload);
}

export async function cerrarAusencia(ausenciaId, { fechaFin = new Date() } = {}, userProfile) {
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido para cerrar ausencia');
  const ownerId = userProfile.ownerId;
  const docRef = doc(db, ...firestoreRoutesCore.ausencias(ownerId), ausenciaId);
  await updateDocWithAppId(docRef, {
    estado: "cerrada",
    fechaFin: toTimestamp(fechaFin),
    updatedAt: serverTimestamp()
  });
}

export const AUSENCIA_ESTADOS = [
  { value: "activas", label: "Activas" },
  { value: "cerradas", label: "Cerradas" },
  { value: "abierto", label: "Abiertas" },
  { value: "en progreso", label: "En progreso" },
  { value: "cerrada", label: "Cerrada" }
];

export async function getAusenciaTipos({ maxResults = 200 } = {}, userProfile) {
  try {
    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const ausenciasRef = collection(db, ...firestoreRoutesCore.ausencias(ownerId));
    const consulta = query(ausenciasRef, orderBy("tipo", "asc"), limit(maxResults));
    const snapshot = await getDocs(consulta);
    const unique = new Set();
    snapshot.forEach((docSnapshot) => {
      const tipo = docSnapshot.data()?.tipo;
      if (typeof tipo === "string" && tipo.trim()) {
        unique.add(tipo.trim());
      }
    });
    return Array.from(unique);
  } catch (error) {
    console.error("Error obteniendo tipos de ausencias:", error);
    return [];
  }
}



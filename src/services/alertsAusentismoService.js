import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import { db } from "../firebaseControlFile";
import { addDocWithAppId, updateDocWithAppId } from "../firebase/firestoreAppWriter";
import { firestoreRoutesCore } from "../core/firestore/firestoreRoutes.core";

const ALERT_TYPES = ["bradford_alto", "reincidencia", "ausencia_prolongada"];

const normalizeSeverity = (value) => {
  const normalized = String(value || "").toLowerCase().trim();
  if (["critica", "critico", "critical"].includes(normalized)) return "critica";
  if (["alta", "high"].includes(normalized)) return "alta";
  return "media";
};

const normalizeTipoAlerta = (value) => {
  const normalized = String(value || "").toLowerCase().trim();
  if (ALERT_TYPES.includes(normalized)) return normalized;
  return "reincidencia";
};

export const buildAlertDedupeKey = ({ empleadoId, tipoAlerta, periodoClave }) => {
  return [
    String(empleadoId || "sin-empleado").trim() || "sin-empleado",
    normalizeTipoAlerta(tipoAlerta),
    String(periodoClave || "sin-periodo").trim() || "sin-periodo"
  ].join("|");
};

const getAlertsRef = (ownerId) => collection(db, ...firestoreRoutesCore.alertsAusentismo(ownerId));

export async function createAlertIfNotExists(input = {}, userProfile) {
  if (!userProfile?.ownerId) throw new Error("userProfile.ownerId es requerido");
  if (!input?.empleadoId) throw new Error("empleadoId es requerido");
  if (!input?.empresaId) throw new Error("empresaId es requerido");
  if (!input?.sucursalId) throw new Error("sucursalId es requerido");

  const ownerId = userProfile.ownerId;
  const tipoAlerta = normalizeTipoAlerta(input.tipoAlerta);
  const periodoClave = String(input.periodoClave || "sin-periodo").trim();
  const dedupeKey =
    String(input.dedupeKey || "").trim() ||
    buildAlertDedupeKey({
      empleadoId: input.empleadoId,
      tipoAlerta,
      periodoClave
    });

  const ref = getAlertsRef(ownerId);
  const existingSnapshot = await getDocs(
    query(ref, where("dedupeKey", "==", dedupeKey), where("estado", "==", "activa"), limit(1))
  );

  if (!existingSnapshot.empty) {
    const existing = existingSnapshot.docs[0];
    return {
      id: existing.id,
      created: false,
      dedupeKey,
      reason: "duplicate"
    };
  }

  const payload = {
    ownerId,
    empleadoId: String(input.empleadoId),
    empleadoNombre: input.empleadoNombre || null,
    empresaId: String(input.empresaId),
    sucursalId: String(input.sucursalId),
    ausenciaId: input.ausenciaId ? String(input.ausenciaId) : null,
    tipoAlerta,
    descripcion: String(input.descripcion || "Alerta de ausentismo"),
    severidad: normalizeSeverity(input.severidad),
    contexto: input.contexto && typeof input.contexto === "object" ? input.contexto : {},
    periodoClave,
    dedupeKey,
    estado: "activa",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userProfile.uid || null
  };

  const docRef = await addDocWithAppId(ref, payload);
  return {
    id: docRef.id,
    created: true,
    dedupeKey
  };
}

export async function listAlertsAusentismo(
  { empresaId = null, sucursalId = null, empleadoId = null, estado = "activa", max = 100 } = {},
  userProfile
) {
  if (!userProfile?.ownerId) throw new Error("userProfile.ownerId es requerido");

  const ownerId = userProfile.ownerId;
  const ref = getAlertsRef(ownerId);
  const constraints = [];

  if (empresaId) constraints.push(where("empresaId", "==", String(empresaId)));
  if (sucursalId) constraints.push(where("sucursalId", "==", String(sucursalId)));
  if (empleadoId) constraints.push(where("empleadoId", "==", String(empleadoId)));
  if (estado && estado !== "todos") constraints.push(where("estado", "==", String(estado)));

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(Math.max(1, Number(max) || 100)));

  const snapshot = await getDocs(query(ref, ...constraints));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function resolveAlertAusentismo(alertId, userProfile, { estado = "resuelta" } = {}) {
  if (!alertId) throw new Error("alertId es requerido");
  if (!userProfile?.ownerId) throw new Error("userProfile.ownerId es requerido");

  const ownerId = userProfile.ownerId;
  const alertRef = doc(db, ...firestoreRoutesCore.alertAusentismo(ownerId, String(alertId)));
  const snap = await getDoc(alertRef);
  if (!snap.exists()) {
    return { id: String(alertId), updated: false, reason: "not_found" };
  }

  await updateDocWithAppId(alertRef, {
    estado: String(estado || "resuelta"),
    resolvedAt: serverTimestamp(),
    resolvedBy: userProfile.uid || null,
    updatedAt: serverTimestamp()
  });

  return { id: String(alertId), updated: true };
}

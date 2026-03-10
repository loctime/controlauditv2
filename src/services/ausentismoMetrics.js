import { computeDiasAusente } from "./ausenciasService";

const CLOSED_STATUSES = ["cerrada", "cerrado", "finalizada", "finalizado", "resuelto", "resuelta"];

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") {
    try {
      return value.toDate();
    } catch (error) {
      return null;
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (value) => {
  const date = toDate(value);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const endOfDay = (value) => {
  const date = toDate(value);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
};

const isClosed = (estado) => {
  const normalized = (estado || "").toLowerCase().trim();
  return CLOSED_STATUSES.some((status) => normalized.includes(status));
};

const resolveCertificate = (ausencia) => {
  const directUrl =
    ausencia?.certificadoUrl ||
    ausencia?.certificadoURL ||
    ausencia?.certificadoMedicoUrl ||
    ausencia?.certificadoMedicoURL ||
    ausencia?.certificado?.url ||
    null;

  const directFileId =
    ausencia?.certificadoFileId ||
    ausencia?.certificado?.fileId ||
    ausencia?.certificadoMedicoFileId ||
    null;

  const hasCertificate =
    Boolean(directUrl) ||
    Boolean(directFileId) ||
    (typeof ausencia?.filesCount === 'number' && ausencia.filesCount > 0) ||
    ausencia?.certificado === true ||
    ausencia?.certificadoMedico === true;

  return {
    available: hasCertificate,
    url: directUrl,
    fileId: directFileId
  };
};

const overlapDays = (fechaInicio, fechaFin, rangeStart, rangeEnd) => {
  const start = startOfDay(fechaInicio);
  const end = endOfDay(fechaFin);
  if (!start || !end) return 0;

  const startMs = Math.max(start.getTime(), rangeStart.getTime());
  const endMs = Math.min(end.getTime(), rangeEnd.getTime());
  if (endMs < startMs) return 0;

  return Math.floor((endMs - startMs) / (24 * 60 * 60 * 1000)) + 1;
};

export const normalizeAusenciaRecord = (ausencia, now = new Date()) => {
  const fechaInicio = toDate(ausencia?.fechaInicio || ausencia?.inicio || ausencia?.createdAt);
  const fechaFinRaw = toDate(ausencia?.fechaFin || ausencia?.fin || null);
  const estado = ausencia?.estado || ausencia?.status || "abierta";
  const cerrada = isClosed(estado);
  const fechaFin = cerrada ? fechaFinRaw || now : now;

  const diasCalculados = cerrada
    ? computeDiasAusente(fechaInicio, fechaFin)
    : computeDiasAusente(fechaInicio, null, now);

  const diasAusente =
    typeof ausencia?.diasAusente === "number" && ausencia.diasAusente > 0 && cerrada
      ? ausencia.diasAusente
      : diasCalculados;

  const certificado = resolveCertificate(ausencia);

  return {
    id: ausencia?.id || `aus-${Math.random().toString(36).slice(2, 8)}`,
    empleadoId: ausencia?.empleadoId || null,
    empleadoNombre: ausencia?.empleadoNombre || "Empleado sin nombre",
    empresaId: ausencia?.empresaId || null,
    empresaNombre: ausencia?.empresaNombre || "Sin empresa",
    sucursalId: ausencia?.sucursalId || null,
    sucursalNombre: ausencia?.sucursalNombre || "Sin sucursal",
    tipo: ausencia?.tipo || ausencia?.categoria || ausencia?.clasificacion || "Sin tipo",
    estado,
    fechaInicio,
    fechaFin: fechaFinRaw,
    fechaFinCalculo: fechaFin,
    diasAusente,
    observaciones: ausencia?.observaciones || "",
    certificado
  };
};

export const buildEmployeeAbsenceHistory = (ausencias = [], now = new Date()) => {
  return (Array.isArray(ausencias) ? ausencias : [])
    .map((ausencia) => normalizeAusenciaRecord(ausencia, now))
    .sort((a, b) => (b.fechaInicio?.getTime() || 0) - (a.fechaInicio?.getTime() || 0));
};

export const getTopEmployeesByAbsentDays = (ausencias = [], { limit = 10, now = new Date() } = {}) => {
  const byEmployee = new Map();

  buildEmployeeAbsenceHistory(ausencias, now).forEach((item) => {
    const key = item.empleadoId || item.empleadoNombre;
    if (!key) return;

    if (!byEmployee.has(key)) {
      byEmployee.set(key, {
        empleadoId: item.empleadoId,
        empleadoNombre: item.empleadoNombre,
        totalDiasAusente: 0,
        totalAusencias: 0,
        abiertas: 0
      });
    }

    const agg = byEmployee.get(key);
    agg.totalDiasAusente += item.diasAusente || 0;
    agg.totalAusencias += 1;
    if (!isClosed(item.estado)) {
      agg.abiertas += 1;
    }
  });

  return Array.from(byEmployee.values())
    .sort((a, b) => {
      if (b.totalDiasAusente !== a.totalDiasAusente) {
        return b.totalDiasAusente - a.totalDiasAusente;
      }
      return b.totalAusencias - a.totalAusencias;
    })
    .slice(0, limit);
};

export const getTopSucursalesByAbsentDays = (ausencias = [], { limit = 10, now = new Date() } = {}) => {
  const bySucursal = new Map();

  buildEmployeeAbsenceHistory(ausencias, now).forEach((item) => {
    const key = item.sucursalId || item.sucursalNombre;
    if (!key) return;

    if (!bySucursal.has(key)) {
      bySucursal.set(key, {
        sucursalId: item.sucursalId,
        sucursalNombre: item.sucursalNombre,
        empresaNombre: item.empresaNombre,
        totalDiasAusente: 0,
        totalAusencias: 0
      });
    }

    const agg = bySucursal.get(key);
    agg.totalDiasAusente += item.diasAusente || 0;
    agg.totalAusencias += 1;
  });

  return Array.from(bySucursal.values())
    .sort((a, b) => {
      if (b.totalDiasAusente !== a.totalDiasAusente) {
        return b.totalDiasAusente - a.totalDiasAusente;
      }
      return b.totalAusencias - a.totalAusencias;
    })
    .slice(0, limit);
};

export const getAbsentTodayEmployeesCount = (ausencias = [], now = new Date()) => {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const uniqueEmployees = new Set();

  buildEmployeeAbsenceHistory(ausencias, now).forEach((item) => {
    if (!item.fechaInicio) return;
    const days = overlapDays(item.fechaInicio, item.fechaFinCalculo, todayStart, todayEnd);
    if (days > 0 && item.empleadoId) {
      uniqueEmployees.add(item.empleadoId);
    } else if (days > 0 && item.empleadoNombre) {
      uniqueEmployees.add(item.empleadoNombre);
    }
  });

  return uniqueEmployees.size;
};

export const getAbsenteeismKpis = (ausencias = [], now = new Date()) => {
  const history = buildEmployeeAbsenceHistory(ausencias, now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const diasPerdidosMes = history.reduce((acc, item) => {
    return acc + overlapDays(item.fechaInicio, item.fechaFinCalculo, monthStart, monthEnd);
  }, 0);

  const totalAusenciasMes = history.reduce((acc, item) => {
    return acc + (overlapDays(item.fechaInicio, item.fechaFinCalculo, monthStart, monthEnd) > 0 ? 1 : 0);
  }, 0);

  const totalDuracion = history.reduce((acc, item) => acc + (item.diasAusente || 0), 0);
  const promedioDuracionAusencia = history.length > 0
    ? Number((totalDuracion / history.length).toFixed(1))
    : 0;

  return {
    empleadosAusentesHoy: getAbsentTodayEmployeesCount(ausencias, now),
    diasPerdidosMes,
    promedioDuracionAusencia,
    totalAusenciasMes
  };
};



import { computeDiasAusente } from "./ausenciasService";

const DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") {
    try {
      return value.toDate();
    } catch (_error) {
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

const addDays = (date, days) => {
  const base = toDate(date);
  if (!base) return null;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
};

const addMonths = (date, months) => {
  const base = toDate(date);
  if (!base) return null;
  return new Date(base.getFullYear(), base.getMonth() + months, base.getDate());
};

const normalizeEstado = (estado) => {
  const normalized = String(estado || "").toLowerCase().trim().replace(/\s+/g, "_");
  if (
    normalized.includes("cerr") ||
    normalized.includes("finaliz") ||
    normalized.includes("resuelt")
  ) {
    return "cerrada";
  }
  if (normalized.includes("progreso")) {
    return "en_progreso";
  }
  return "abierta";
};

const isClosed = (estado) => normalizeEstado(estado) === "cerrada";

const isIgnoredEstado = (estado) => {
  const normalized = String(estado || "").toLowerCase().trim().replace(/\s+/g, "_");
  return normalized.includes("anulad") || normalized.includes("cancelad");
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
    (typeof ausencia?.filesCount === "number" && ausencia.filesCount > 0) ||
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
  if (!start || !end || !rangeStart || !rangeEnd) return 0;

  const startMs = Math.max(start.getTime(), rangeStart.getTime());
  const endMs = Math.min(end.getTime(), rangeEnd.getTime());
  if (endMs < startMs) return 0;

  return Math.floor((endMs - startMs) / DAY_MS) + 1;
};

export const normalizeAusenciaRecord = (ausencia, now = new Date()) => {
  const fechaInicio = toDate(ausencia?.fechaInicio || ausencia?.inicio || ausencia?.createdAt);
  const fechaFinRaw = toDate(ausencia?.fechaFin || ausencia?.fin || null);
  const estado = normalizeEstado(ausencia?.estado || ausencia?.status || "abierta");
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
    motivo: ausencia?.motivo || ausencia?.tipo || "Sin motivo",
    origen: ausencia?.origen || "manual",
    origenId: ausencia?.origenId || null,
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

// ===== FASE 3: METRICAS AVANZADAS =====

const toValidHistory = (ausencias = [], now = new Date()) =>
  buildEmployeeAbsenceHistory(ausencias, now).filter(
    (item) => item.fechaInicio && !isIgnoredEstado(item.estado)
  );

export const filterAusenciasPeriodo = (
  ausencias = [],
  { from = null, to = null, includeOpen = true } = {}
) => {
  const fromDate = startOfDay(from);
  const toDateValue = endOfDay(to);

  return toValidHistory(ausencias).filter((item) => {
    if (!includeOpen && item.estado !== "cerrada") return false;

    const start = startOfDay(item.fechaInicio);
    const end = endOfDay(item.fechaFinCalculo || item.fechaInicio);
    if (!start || !end) return false;

    if (fromDate && end < fromDate) return false;
    if (toDateValue && start > toDateValue) return false;
    return true;
  });
};

export const groupAusenciasByEmpleado = (ausencias = []) => {
  return (Array.isArray(ausencias) ? ausencias : []).reduce((acc, item) => {
    if (!item?.empleadoId) return acc;
    if (!acc[item.empleadoId]) {
      acc[item.empleadoId] = [];
    }
    acc[item.empleadoId].push(item);
    return acc;
  }, {});
};

export const classifyBradfordRisk = (score = 0) => {
  const value = Number(score) || 0;
  if (value >= 400) return "critico";
  if (value >= 200) return "alto";
  if (value >= 50) return "medio";
  return "bajo";
};

export const calculateBradfordByEmpleado = (
  ausencias = [],
  { now = new Date(), monthsBack = 12 } = {}
) => {
  const from = addMonths(now, -Math.max(1, monthsBack));
  const periodRecords = filterAusenciasPeriodo(ausencias, {
    from,
    to: now,
    includeOpen: true
  });

  const byEmpleado = groupAusenciasByEmpleado(periodRecords);

  return Object.entries(byEmpleado)
    .map(([empleadoId, historial]) => {
      const ausenciasPeriodo = historial.length;
      const diasAusentes = historial.reduce((acc, item) => acc + (item.diasAusente || 0), 0);
      const bradfordScore = ausenciasPeriodo * ausenciasPeriodo * diasAusentes;
      return {
        empleadoId,
        empleadoNombre: historial[0]?.empleadoNombre || "Empleado sin nombre",
        ausenciasPeriodo,
        diasAusentes,
        bradfordScore,
        bradfordRisk: classifyBradfordRisk(bradfordScore)
      };
    })
    .sort((a, b) => b.bradfordScore - a.bradfordScore);
};

export const detectReincidenciaEmpleado = (
  historialEmpleado = [],
  reglas = {
    ventanaCortaDias: 60,
    minimoAusenciasCortas: 3,
    ventanaLargaMeses: 12,
    minimoAusenciasLargas: 5,
    consecutivasMismoMotivo: 2
  }
) => {
  const sorted = [...(Array.isArray(historialEmpleado) ? historialEmpleado : [])]
    .filter((item) => item?.fechaInicio)
    .sort((a, b) => (b.fechaInicio?.getTime() || 0) - (a.fechaInicio?.getTime() || 0));

  if (sorted.length === 0) {
    return { hasReincidencia: false, rulesTriggered: [] };
  }

  const now = new Date();
  const rulesTriggered = [];
  const shortFrom = addDays(now, -Math.max(1, reglas.ventanaCortaDias || 60));
  const longFrom = addMonths(now, -Math.max(1, reglas.ventanaLargaMeses || 12));

  const countShort = sorted.filter((item) => item.fechaInicio >= shortFrom).length;
  if (countShort >= (reglas.minimoAusenciasCortas || 3)) {
    rulesTriggered.push("3_en_60_dias");
  }

  const countLong = sorted.filter((item) => item.fechaInicio >= longFrom).length;
  if (countLong >= (reglas.minimoAusenciasLargas || 5)) {
    rulesTriggered.push("5_en_12_meses");
  }

  const consecutiveNeeded = Math.max(2, reglas.consecutivasMismoMotivo || 2);
  if (sorted.length >= consecutiveNeeded) {
    const lastN = sorted.slice(0, consecutiveNeeded);
    const sameMotivo = lastN.every((item) =>
      String(item?.motivo || "").trim().toLowerCase() ===
      String(lastN[0]?.motivo || "").trim().toLowerCase()
    );
    if (sameMotivo && String(lastN[0]?.motivo || "").trim()) {
      rulesTriggered.push("2_consecutivas_mismo_motivo");
    }
  }

  return {
    hasReincidencia: rulesTriggered.length > 0,
    rulesTriggered
  };
};

export const detectAusenciasProlongadas = (
  ausencias = [],
  { thresholdDays = 15, now = new Date() } = {}
) => {
  const minDays = Math.max(1, Number(thresholdDays) || 15);
  return toValidHistory(ausencias, now)
    .filter((item) => item.estado !== "cerrada")
    .map((item) => {
      const diasAbierta = computeDiasAusente(item.fechaInicio, null, now);
      return {
        ...item,
        diasAbierta
      };
    })
    .filter((item) => item.diasAbierta > minDays)
    .sort((a, b) => b.diasAbierta - a.diasAbierta);
};

export const buildMonthlyTrend = (
  ausencias = [],
  { months = 12, now = new Date() } = {}
) => {
  const count = Math.max(1, Number(months) || 12);
  const history = toValidHistory(ausencias, now);
  const trend = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);

    const diasPerdidos = history.reduce(
      (acc, item) => acc + overlapDays(item.fechaInicio, item.fechaFinCalculo, monthStart, monthEnd),
      0
    );
    const ausenciasCount = history.reduce(
      (acc, item) => acc + (overlapDays(item.fechaInicio, item.fechaFinCalculo, monthStart, monthEnd) > 0 ? 1 : 0),
      0
    );

    trend.push({
      key: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`,
      label: monthStart.toLocaleDateString("es-AR", { month: "short", year: "numeric" }),
      ausencias: ausenciasCount,
      diasPerdidos
    });
  }

  return trend;
};

export const buildAusenciasByMotivo = (ausencias = [], { now = new Date() } = {}) => {
  const grouped = new Map();

  toValidHistory(ausencias, now).forEach((item) => {
    const key = String(item.motivo || "Sin motivo").trim() || "Sin motivo";
    if (!grouped.has(key)) {
      grouped.set(key, {
        motivo: key,
        cantidad: 0,
        diasPerdidos: 0
      });
    }
    const agg = grouped.get(key);
    agg.cantidad += 1;
    agg.diasPerdidos += item.diasAusente || 0;
  });

  return Array.from(grouped.values()).sort((a, b) => b.cantidad - a.cantidad);
};

export const buildOrigenDistribution = (ausencias = [], { now = new Date() } = {}) => {
  const grouped = new Map();

  toValidHistory(ausencias, now).forEach((item) => {
    const key = String(item.origen || "manual").trim().toLowerCase() || "manual";
    if (!grouped.has(key)) {
      grouped.set(key, {
        origen: key,
        cantidad: 0,
        diasPerdidos: 0,
        porcentaje: 0
      });
    }
    const agg = grouped.get(key);
    agg.cantidad += 1;
    agg.diasPerdidos += item.diasAusente || 0;
  });

  const total = Array.from(grouped.values()).reduce((acc, item) => acc + item.cantidad, 0);
  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      porcentaje: total > 0 ? Number(((item.cantidad / total) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
};

export const buildAdvancedAbsenteeismKpis = (
  ausencias = [],
  { now = new Date(), empleadosTotales = 0 } = {}
) => {
  const history = toValidHistory(ausencias, now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const diasPerdidosMes = history.reduce(
    (acc, item) => acc + overlapDays(item.fechaInicio, item.fechaFinCalculo, monthStart, monthEnd),
    0
  );
  const totalAusenciasMes = history.reduce(
    (acc, item) => acc + (overlapDays(item.fechaInicio, item.fechaFinCalculo, monthStart, monthEnd) > 0 ? 1 : 0),
    0
  );
  const duracionPromedio = history.length > 0
    ? Number((history.reduce((acc, item) => acc + (item.diasAusente || 0), 0) / history.length).toFixed(1))
    : 0;

  const empleadosUnicos = new Set(
    history.map((item) => item.empleadoId || item.empleadoNombre).filter(Boolean)
  );

  const tasaAusentismo =
    Number(empleadosTotales) > 0
      ? Number(((empleadosUnicos.size / Number(empleadosTotales)) * 100).toFixed(2))
      : 0;

  const diasPerdidosPorEmpleado =
    Number(empleadosTotales) > 0
      ? Number((diasPerdidosMes / Number(empleadosTotales)).toFixed(2))
      : 0;

  const origenDistribution = buildOrigenDistribution(history, { now });

  return {
    empleadosAusentesHoy: getAbsentTodayEmployeesCount(history, now),
    diasPerdidosMes,
    promedioDuracionAusencia: duracionPromedio,
    totalAusenciasMes,
    tasaAusentismo,
    diasPerdidosPorEmpleado,
    porcentajePorOrigen: origenDistribution
  };
};

// Export map Fase 3 (documentacion rapida)
export const AUSENTISMO_METRICS_EXPORTS = [
  "normalizeAusenciaRecord",
  "buildEmployeeAbsenceHistory",
  "getTopEmployeesByAbsentDays",
  "getTopSucursalesByAbsentDays",
  "getAbsentTodayEmployeesCount",
  "getAbsenteeismKpis",
  "filterAusenciasPeriodo",
  "groupAusenciasByEmpleado",
  "calculateBradfordByEmpleado",
  "classifyBradfordRisk",
  "detectReincidenciaEmpleado",
  "detectAusenciasProlongadas",
  "buildAdvancedAbsenteeismKpis",
  "buildMonthlyTrend",
  "buildAusenciasByMotivo",
  "buildOrigenDistribution"
];

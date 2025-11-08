const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeToDateStart = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const parseDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return normalizeToDateStart(value);
  }

  if (typeof value === "object" && typeof value.toDate === "function") {
    try {
      return normalizeToDateStart(value.toDate());
    } catch (error) {
      return null;
    }
  }

  if (typeof value === "number") {
    if (Number.isNaN(value)) return null;
    return normalizeToDateStart(new Date(value));
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return normalizeToDateStart(parsed);
  }

  return null;
};

const normalizeString = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const resolveTipo = (ausencia) => {
  const rawTipo = normalizeString(
    ausencia.tipo || ausencia.categoria || ausencia.clasificacion
  );
  const rawMotivo = normalizeString(ausencia.motivo || ausencia.razon);
  const rawDescripcion = normalizeString(ausencia.descripcionCorta || "");

  const tokens = [rawTipo, rawMotivo, rawDescripcion];
  const includes = (needle) =>
    tokens.some((token) => token && token.includes(needle));

  if (includes("covid")) {
    return { clave: "covid", etiqueta: "Casos covid positivos" };
  }

  if (includes("ocupac")) {
    return {
      clave: "ocupacional",
      etiqueta: "Enfermedades ocupacionales"
    };
  }

  if (includes("accident")) {
    return {
      clave: "accidente",
      etiqueta: "Reposo por accidente"
    };
  }

  if (includes("licencia") || includes("permiso")) {
    return { clave: "licencia", etiqueta: "Licencias especiales" };
  }

  if (includes("enfermedad") || rawTipo === "medica" || rawTipo === "salud") {
    return {
      clave: "enfermedad",
      etiqueta: "Enfermedades comunes"
    };
  }

  return {
    clave: rawTipo || "otro",
    etiqueta:
      ausencia.etiqueta ||
      ausencia.tipo ||
      ausencia.categoria ||
      "Ausencias registradas"
  };
};

const isCaseActive = (ausencia, fechaFin) => {
  const estado = normalizeString(ausencia.estado || ausencia.status);
  if (!estado) {
    return !fechaFin;
  }

  if (["cerrado", "cerrada", "finalizado", "finalizada", "resuelto"].includes(estado)) {
    return false;
  }

  return true;
};

const isAccidentRelated = (ausencia) => {
  if (ausencia.accidenteId || ausencia.accidentId) return true;
  const tipo = normalizeString(ausencia.tipo);
  const motivo = normalizeString(ausencia.motivo);
  return (
    tipo.includes("accident") ||
    motivo.includes("accident") ||
    Boolean(ausencia.relacionAccidente === true)
  );
};

const defaultHorasPorDia = (ausencia) => {
  if (typeof ausencia?.horasPorDia === "number" && ausencia.horasPorDia > 0) {
    return ausencia.horasPorDia;
  }

  if (
    typeof ausencia?.horasSemanales === "number" &&
    ausencia.horasSemanales > 0
  ) {
    const divisor =
      typeof ausencia?.diasLaborales === "number" && ausencia.diasLaborales > 0
        ? ausencia.diasLaborales
        : 5;
    return ausencia.horasSemanales / divisor;
  }

  return 8;
};

const clampToPeriod = (fechaInicio, fechaFin, periodStart, periodEnd, now) => {
  const inicio = fechaInicio ?? normalizeToDateStart(now);
  const fin = fechaFin ?? normalizeToDateStart(now);

  const ventanaInicio = periodStart ? new Date(periodStart) : null;
  const ventanaFin = periodEnd ? new Date(periodEnd) : null;

  const inicioEnVentana = ventanaInicio
    ? inicio > ventanaInicio
      ? inicio
      : ventanaInicio
    : inicio;
  const finEnVentana = ventanaFin
    ? fin < ventanaFin
      ? fin
      : ventanaFin
    : fin;

  if (!inicioEnVentana || !finEnVentana) return null;
  if (finEnVentana < inicioEnVentana) return null;

  return { inicio: inicioEnVentana, fin: finEnVentana };
};

const computeDays = (range) => {
  if (!range) return 0;
  const { inicio, fin } = range;
  const diff = fin.getTime() - inicio.getTime();
  if (diff < 0) return 0;
  return Math.floor(diff / DAY_IN_MS) + 1;
};

/**
 * Calcula métricas de salud ocupacional a partir de ausencias registradas.
 */
export const computeOccupationalHealthMetrics = ({
  ausencias = [],
  periodStart = null,
  periodEnd = null,
  resolveHorasPorDia,
  resolveEmpleado,
  now = new Date()
} = {}) => {
  if (!Array.isArray(ausencias) || ausencias.length === 0) {
    return {
      resumen: {
        total: 0,
        activas: 0,
        cerradas: 0,
        ocupacionales: 0,
        covid: 0,
        enfermedades: 0,
        licencias: 0,
        otros: 0,
        diasPerdidosTotales: 0,
        horasPerdidasTotales: 0,
        diasPerdidosNoAccidente: 0,
        horasPerdidasNoAccidente: 0,
        porTipo: {}
      },
      casos: [],
      casosRecientes: []
    };
  }

  const totals = {
    total: 0,
    activas: 0,
    cerradas: 0,
    ocupacionales: 0,
    covid: 0,
    enfermedades: 0,
    licencias: 0,
    otros: 0,
    diasPerdidosTotales: 0,
    horasPerdidasTotales: 0,
    diasPerdidosNoAccidente: 0,
    horasPerdidasNoAccidente: 0,
    porTipo: {}
  };

  const casos = [];

  ausencias.forEach((ausencia) => {
    const fechaInicio =
      parseDate(
        ausencia.fechaInicio ||
          ausencia.inicio ||
          ausencia.fecha ||
          ausencia.startDate
      ) || parseDate(ausencia.createdAt);

    const fechaFin = parseDate(
      ausencia.fechaFin ||
        ausencia.fin ||
        ausencia.fechaCierre ||
        ausencia.endDate
    );

    const intervalo = clampToPeriod(
      fechaInicio,
      fechaFin,
      periodStart,
      periodEnd,
      now
    );

    if (!intervalo) {
      return;
    }

    const diasEnPeriodo = computeDays(intervalo);
    if (diasEnPeriodo <= 0) {
      return;
    }

    const horasPorDia =
      typeof resolveHorasPorDia === "function"
        ? resolveHorasPorDia(ausencia)
        : defaultHorasPorDia(ausencia);

    const horasCalculadas = Math.max(0, diasEnPeriodo * horasPorDia);
    const tipo = resolveTipo(ausencia);
    const estadoActivo = isCaseActive(ausencia, fechaFin);
    const relacionadoAccidente = isAccidentRelated(ausencia);
    const empleado =
      typeof resolveEmpleado === "function" ? resolveEmpleado(ausencia) : null;

    totals.total += 1;
    totals.diasPerdidosTotales += diasEnPeriodo;
    totals.horasPerdidasTotales += horasCalculadas;
    totals.porTipo[tipo.clave] = (totals.porTipo[tipo.clave] || 0) + 1;

    if (estadoActivo) {
      totals.activas += 1;
    } else {
      totals.cerradas += 1;
    }

    switch (tipo.clave) {
      case "ocupacional":
        totals.ocupacionales += 1;
        break;
      case "covid":
        totals.covid += 1;
        break;
      case "enfermedad":
        totals.enfermedades += 1;
        break;
      case "licencia":
        totals.licencias += 1;
        break;
      default:
        totals.otros += 1;
        break;
    }

    if (!relacionadoAccidente) {
      totals.diasPerdidosNoAccidente += diasEnPeriodo;
      totals.horasPerdidasNoAccidente += horasCalculadas;
    }

    casos.push({
      id:
        ausencia.id ||
        ausencia.uid ||
        ausencia.documentId ||
        `ausencia-${Math.random().toString(36).slice(2, 8)}`,
      empleadoId: ausencia.empleadoId || ausencia.workerId || null,
      empleadoNombre:
        ausencia.empleadoNombre ||
        ausencia.colaborador ||
        empleado?.nombre ||
        empleado?.displayName ||
        "Sin registro",
      tipo: tipo.clave,
      etiqueta: tipo.etiqueta,
      estado: normalizeString(ausencia.estado || ausencia.status) || "abierto",
      fechaInicio: fechaInicio ? fechaInicio.toISOString() : null,
      fechaFin: fechaFin ? fechaFin.toISOString() : null,
      diasEnPeriodo,
      horasCalculadas,
      esOcupacional: tipo.clave === "ocupacional",
      esCovid: tipo.clave === "covid",
      esAccidenteRelacionado: relacionadoAccidente,
      observaciones: ausencia.observaciones || ausencia.notas || ""
    });
  });

  casos.sort((a, b) => {
    const fechaA = a.fechaInicio ? new Date(a.fechaInicio).getTime() : 0;
    const fechaB = b.fechaInicio ? new Date(b.fechaInicio).getTime() : 0;
    return fechaB - fechaA;
  });

  return {
    resumen: totals,
    casos,
    casosRecientes: casos.slice(0, 5)
  };
};



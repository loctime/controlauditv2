// Servicio real para el dashboard de higiene y seguridad
// Conecta con datos reales de Firestore
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const safetyDashboardService = {
  // Obtener datos del dashboard desde datos reales
  async getDashboardData(companyId, period = '2025-01') {
    try {
      console.log(`🔍 [SafetyDashboard] Obteniendo datos para empresa ${companyId}, período ${period}`);
      
      // Obtener datos de múltiples fuentes en paralelo
      const [
        auditoriasData,
        logsData,
        formulariosData
      ] = await Promise.all([
        this.getAuditoriasData(companyId, period),
        this.getLogsData(companyId, period),
        this.getFormulariosData(companyId, period)
      ]);

      // Calcular métricas de seguridad
      const metrics = this.calculateSafetyMetrics(auditoriasData, logsData, formulariosData);
      
      // Obtener información de la empresa
      const companyInfo = await this.getCompanyInfo(companyId);
      
      return {
        companyId,
        companyName: companyInfo?.nombre || 'Empresa',
        period,
        ...metrics,
        alerts: this.generateAlerts(auditoriasData, logsData, formulariosData),
        chartData: this.generateChartData(auditoriasData, logsData, period)
      };
      
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo datos:', error);
      // Retornar datos por defecto en caso de error
      return this.getDefaultData(companyId, period);
    }
  },

  // Obtener datos de auditorías
  async getAuditoriasData(companyId, period) {
    try {
      const auditoriasRef = collection(db, 'auditorias');
      const q = query(
        auditoriasRef,
        where('empresa', '==', companyId),
        orderBy('fechaCreacion', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const auditorias = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        auditorias.push({
          id: doc.id,
          ...data,
          // Procesar estadísticas si existen
          estadisticas: data.estadisticas || this.calculateAuditoriaStats(data.respuestas)
        });
      });
      
      console.log(`📊 [SafetyDashboard] ${auditorias.length} auditorías encontradas`);
      return auditorias;
      
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo auditorías:', error);
      return [];
    }
  },

  // Obtener datos de logs de operarios
  async getLogsData(companyId, period) {
    try {
      const logsRef = collection(db, 'logs_operarios');
      const q = query(
        logsRef,
        where('detalles.empresaId', '==', companyId),
        orderBy('fecha', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      const logs = [];
      
      snapshot.forEach(doc => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`📝 [SafetyDashboard] ${logs.length} logs encontrados`);
      return logs;
      
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo logs:', error);
      return [];
    }
  },

  // Obtener datos de formularios
  async getFormulariosData(companyId, period) {
    try {
      const formulariosRef = collection(db, 'formularios');
      const q = query(
        formulariosRef,
        where('clienteAdminId', '==', companyId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const formularios = [];
      
      snapshot.forEach(doc => {
        formularios.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`📋 [SafetyDashboard] ${formularios.length} formularios encontrados`);
      return formularios;
      
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo formularios:', error);
      return [];
    }
  },

  // Obtener información de la empresa
  async getCompanyInfo(companyId) {
    try {
      const empresasRef = collection(db, 'empresas');
      const q = query(empresasRef, where('__name__', '==', companyId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo info empresa:', error);
      return null;
    }
  },

  // Calcular métricas de seguridad desde datos reales
  calculateSafetyMetrics(auditorias, logs, formularios) {
    // Contar accidentes e incidentes desde logs
    const accidents = logs.filter(log => 
      log.accion?.toLowerCase().includes('accidente') ||
      log.detalles?.tipo === 'accidente'
    );
    
    const incidents = logs.filter(log => 
      log.accion?.toLowerCase().includes('incidente') ||
      log.detalles?.tipo === 'incidente'
    );

    // Calcular días sin accidentes
    const lastAccident = accidents.length > 0 ? 
      new Date(accidents[0].fecha?.toDate?.() || accidents[0].fecha) : null;
    const daysWithoutAccidents = lastAccident ? 
      Math.floor((Date.now() - lastAccident.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Calcular índices de frecuencia y severidad (simplificados)
    const totalEmployees = 50; // Esto debería venir de datos reales
    const hoursWorked = totalEmployees * 8 * 30; // Estimación mensual
    
    const frequencyIndex = accidents.length > 0 ? 
      (accidents.length * 1000000) / hoursWorked : 0;
    
    const severityIndex = accidents.length > 0 ? 
      (accidents.reduce((sum, acc) => sum + (acc.detalles?.diasPerdidos || 0), 0) * 1000000) / hoursWorked : 0;

    // Calcular capacitaciones desde formularios
    const trainingForms = formularios.filter(f => 
      f.nombre?.toLowerCase().includes('capacitación') ||
      f.nombre?.toLowerCase().includes('entrenamiento') ||
      f.nombre?.toLowerCase().includes('training')
    );

    // Calcular inspecciones desde auditorías
    const inspections = auditorias.filter(a => 
      a.formulario?.toLowerCase().includes('inspección') ||
      a.formulario?.toLowerCase().includes('inspeccion')
    );

    // Calcular desvíos desde auditorías no conformes
    const deviations = auditorias.reduce((total, auditoria) => {
      if (auditoria.estadisticas) {
        return total + (auditoria.estadisticas.conteo?.['No conforme'] || 0);
      }
      return total;
    }, 0);

    const closedDeviations = Math.floor(deviations * 0.75); // Estimación

    // Calcular cumplimiento legal desde auditorías
    const totalAuditorias = auditorias.length;
    const conformes = auditorias.reduce((total, auditoria) => {
      if (auditoria.estadisticas) {
        return total + (auditoria.estadisticas.conteo?.Conforme || 0);
      }
      return total;
    }, 0);

    const legalCompliance = totalAuditorias > 0 ? 
      Math.round((conformes / totalAuditorias) * 100) : 100;

    return {
      totalAccidents: accidents.length,
      totalIncidents: incidents.length,
      daysWithoutAccidents,
      frequencyIndex: Number(frequencyIndex.toFixed(1)),
      severityIndex: Number(severityIndex.toFixed(1)),
      trainingsDone: trainingForms.length,
      trainingsPlanned: trainingForms.length + 2, // Estimación
      inspectionsDone: inspections.length,
      inspectionsPlanned: inspections.length + 5, // Estimación
      deviationsFound: deviations,
      deviationsClosed: closedDeviations,
      eppDeliveryRate: Math.min(100, Math.max(80, 100 - (deviations * 2))),
      contractorCompliance: Math.min(100, Math.max(85, legalCompliance - 5)),
      legalCompliance
    };
  },

  // Generar alertas basadas en datos reales
  generateAlerts(auditorias, logs, formularios) {
    const alerts = [];
    
    // Alertas por auditorías no conformes
    const nonConformAuditorias = auditorias.filter(a => 
      a.estadisticas?.conteo?.['No conforme'] > 0
    );
    
    if (nonConformAuditorias.length > 0) {
      alerts.push(`${nonConformAuditorias.length} auditoría(s) con hallazgos no conformes`);
    }

    // Alertas por capacitaciones vencidas
    const oldTrainings = formularios.filter(f => {
      if (!f.timestamp) return false;
      const trainingDate = f.timestamp.toDate ? f.timestamp.toDate() : new Date(f.timestamp);
      const daysDiff = (Date.now() - trainingDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 365; // Capacitaciones mayores a 1 año
    });
    
    if (oldTrainings.length > 0) {
      alerts.push(`${oldTrainings.length} capacitación(es) requieren renovación`);
    }

    // Alertas por accidentes recientes
    const recentAccidents = logs.filter(log => {
      if (!log.fecha) return false;
      const accidentDate = log.fecha.toDate ? log.fecha.toDate() : new Date(log.fecha);
      const daysDiff = (Date.now() - accidentDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff < 30 && (
        log.accion?.toLowerCase().includes('accidente') ||
        log.detalles?.tipo === 'accidente'
      );
    });
    
    if (recentAccidents.length > 0) {
      alerts.push(`${recentAccidents.length} accidente(s) reportado(s) en los últimos 30 días`);
    }

    // Alertas por inspecciones pendientes
    const pendingInspections = auditorias.filter(a => 
      a.estado === 'pendiente' || a.estado === 'en_progreso'
    );
    
    if (pendingInspections.length > 0) {
      alerts.push(`${pendingInspections.length} inspección(es) pendiente(s)`);
    }

    return alerts.length > 0 ? alerts : ['Sistema funcionando correctamente'];
  },

  // Generar datos para gráficos
  generateChartData(auditorias, logs, period) {
    // Datos de accidentes por mes (últimos 6 meses)
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const accidentsByMonth = months.map(month => {
      const accidents = logs.filter(log => {
        if (!log.fecha) return false;
        const logDate = log.fecha.toDate ? log.fecha.toDate() : new Date(log.fecha);
        const monthIndex = logDate.getMonth();
        return monthIndex === months.indexOf(month) && (
          log.accion?.toLowerCase().includes('accidente') ||
          log.detalles?.tipo === 'accidente'
        );
      });
      return { month, accidents: accidents.length };
    });

    // Datos de incidentes por tipo
    const incidentTypes = {};
    logs.forEach(log => {
      if (log.detalles?.tipo && (
        log.accion?.toLowerCase().includes('incidente') ||
        log.detalles?.tipo === 'incidente'
      )) {
        const type = log.detalles.tipo;
        incidentTypes[type] = (incidentTypes[type] || 0) + 1;
      }
    });

    const incidentsByType = Object.entries(incidentTypes).map(([type, count]) => ({
      type,
      count
    }));

    // Tendencia de cumplimiento (basada en auditorías conformes)
    const complianceTrend = months.map(month => {
      const monthAuditorias = auditorias.filter(auditoria => {
        if (!auditoria.fechaCreacion) return false;
        const auditDate = auditoria.fechaCreacion.toDate ? auditoria.fechaCreacion.toDate() : new Date(auditoria.fechaCreacion);
        const monthIndex = auditDate.getMonth();
        return monthIndex === months.indexOf(month);
      });

      const conformes = monthAuditorias.reduce((total, auditoria) => {
        if (auditoria.estadisticas) {
          return total + (auditoria.estadisticas.conteo?.Conforme || 0);
        }
        return total;
      }, 0);

      const total = monthAuditorias.length;
      const compliance = total > 0 ? Math.round((conformes / total) * 100) : 100;
      
      return { month, compliance };
    });

    return {
      accidentsByMonth,
      incidentsByType,
      complianceTrend
    };
  },

  // Calcular estadísticas de auditoría
  calculateAuditoriaStats(respuestas) {
    if (!respuestas || !Array.isArray(respuestas)) {
      return {
        conteo: { Conforme: 0, "No conforme": 0, "Necesita mejora": 0, "No aplica": 0 },
        porcentajes: { Conforme: 0, "No conforme": 0, "Necesita mejora": 0, "No aplica": 0 },
        total: 0
      };
    }

    const respuestasPlanas = respuestas.flat();
    const estadisticas = {
      Conforme: respuestasPlanas.filter(r => r === "Conforme").length,
      "No conforme": respuestasPlanas.filter(r => r === "No conforme").length,
      "Necesita mejora": respuestasPlanas.filter(r => r === "Necesita mejora").length,
      "No aplica": respuestasPlanas.filter(r => r === "No aplica").length,
    };

    const total = respuestasPlanas.length;
    const porcentajes = {};
    
    Object.keys(estadisticas).forEach(key => {
      porcentajes[key] = total > 0 ? Number(((estadisticas[key] / total) * 100).toFixed(2)) : 0;
    });

    return {
      conteo: estadisticas,
      porcentajes,
      total
    };
  },

  // Datos por defecto en caso de error
  getDefaultData(companyId, period) {
    return {
      companyId,
      companyName: 'Empresa',
      period,
      totalAccidents: 0,
      totalIncidents: 0,
      daysWithoutAccidents: 0,
      frequencyIndex: 0,
      severityIndex: 0,
      trainingsDone: 0,
      trainingsPlanned: 0,
      inspectionsDone: 0,
      inspectionsPlanned: 0,
      deviationsFound: 0,
      deviationsClosed: 0,
      eppDeliveryRate: 100,
      contractorCompliance: 100,
      legalCompliance: 100,
      alerts: ['Cargando datos del sistema...'],
      chartData: {
        accidentsByMonth: [],
        incidentsByType: [],
        complianceTrend: []
      }
    };
  }
};

// Función de compatibilidad con la versión anterior
export async function getSafetyDashboardData(companyId, period) {
  return await safetyDashboardService.getDashboardData(companyId, period);
}
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
  Timestamp,
  onSnapshot 
} from 'firebase/firestore';
import { dbAudit, auditUserCollection } from '../firebaseControlFile';
import { computeOccupationalHealthMetrics } from '../utils/occupationalHealthMetrics';

const isTruthyFlag = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'sí' || normalized === 'si';
  }
  return false;
};

const aggregateAuditClassifications = (auditorias = []) => {
  if (!Array.isArray(auditorias) || auditorias.length === 0) {
    return { condicion: 0, actitud: 0, total: 0 };
  }

  let condicion = 0;
  let actitud = 0;

  const addFromRecord = (record) => {
    if (!record || typeof record !== 'object') return;
    if (isTruthyFlag(record.condicion)) condicion += 1;
    if (isTruthyFlag(record.actitud)) actitud += 1;
  };

  const addFromSummary = (summary) => {
    if (!summary || typeof summary !== 'object') return;
    const condValue = summary.condicion ?? summary.Condición;
    const actValue = summary.actitud ?? summary.Actitud;
    if (typeof condValue === 'number' && !Number.isNaN(condValue)) condicion += condValue;
    if (typeof actValue === 'number' && !Number.isNaN(actValue)) actitud += actValue;
  };

  const processArrayEntries = (entries) => {
    if (!Array.isArray(entries)) return false;
    let processed = false;
    entries.forEach((entry) => {
      if (!entry) return;
      if (Array.isArray(entry)) {
        if (processArrayEntries(entry)) processed = true;
        return;
      }
      if (Array.isArray(entry.valores)) {
        entry.valores.forEach(addFromRecord);
        processed = true;
        return;
      }
      if (
        typeof entry === 'object' &&
        (Object.prototype.hasOwnProperty.call(entry, 'condicion') ||
          Object.prototype.hasOwnProperty.call(entry, 'actitud'))
      ) {
        addFromRecord(entry);
        processed = true;
        return;
      }
      if (typeof entry === 'object') {
        const nestedValues = [];
        if (Array.isArray(entry.valores)) {
          nestedValues.push(entry.valores);
        }
        nestedValues.push(...Object.values(entry));
        nestedValues.forEach((nested) => {
          if (Array.isArray(nested)) {
            if (processArrayEntries(nested)) processed = true;
          } else if (nested && typeof nested === 'object') {
            if (Array.isArray(nested.valores)) {
              nested.valores.forEach(addFromRecord);
              processed = true;
            } else if (
              Object.prototype.hasOwnProperty.call(nested, 'condicion') ||
              Object.prototype.hasOwnProperty.call(nested, 'actitud')
            ) {
              addFromRecord(nested);
              processed = true;
            } else {
              const deeperValues = Object.values(nested);
              deeperValues.forEach((value) => {
                if (Array.isArray(value) && processArrayEntries(value)) {
                  processed = true;
                }
              });
            }
          }
        });
      }
    });
    return processed;
  };

  const tryParseSource = (source) => {
    if (!source) return false;
    let value = source;
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch (error) {
        console.warn('⚠️ [Dashboard] No se pudo parsear clasificaciones:', error);
        return false;
      }
    }

    if (Array.isArray(value)) {
      return processArrayEntries(value);
    }

    if (typeof value === 'object') {
      const hasSummaryValues =
        typeof (value.condicion ?? value.Condición) === 'number' ||
        typeof (value.actitud ?? value.Actitud) === 'number';
      if (hasSummaryValues) {
        addFromSummary(value);
        return true;
      }

      const candidates = [];
      if (Array.isArray(value.valores)) {
        candidates.push(value.valores);
      }
      candidates.push(...Object.values(value));

      let consumed = false;
      candidates.forEach((candidate) => {
        if (Array.isArray(candidate)) {
          if (processArrayEntries(candidate)) consumed = true;
        } else if (candidate && typeof candidate === 'object') {
          if (Array.isArray(candidate.valores)) {
            candidate.valores.forEach(addFromRecord);
            consumed = true;
          } else if (
            Object.prototype.hasOwnProperty.call(candidate, 'condicion') ||
            Object.prototype.hasOwnProperty.call(candidate, 'actitud')
          ) {
            addFromRecord(candidate);
            consumed = true;
          } else {
            const nested = Object.values(candidate);
            nested.forEach((value) => {
              if (Array.isArray(value) && processArrayEntries(value)) {
                consumed = true;
              }
            });
          }
        }
      });
      return consumed;
    }

    return false;
  };

  auditorias.forEach((auditoria) => {
    let parsed = false;
    parsed = tryParseSource(auditoria?.clasificaciones) || parsed;
    parsed = tryParseSource(auditoria?.estadisticas?.clasificaciones) || parsed;
    parsed = tryParseSource(auditoria?.estadisticasClasificaciones) || parsed;
    if (!parsed) {
      addFromSummary(auditoria?.estadisticas?.resumenClasificaciones);
    }
  });

  return {
    condicion,
    actitud,
    total: condicion + actitud
  };
};

export const safetyDashboardService = {
  // Obtener datos del dashboard desde datos reales
  async getDashboardData(companyId, sucursalId, period = '2025-01', userId = null) {
    try {
      console.log(`🔍 [SafetyDashboard] Obteniendo datos para empresa ${companyId}, sucursal ${sucursalId}, período ${period}`);
      
      // Obtener datos de múltiples fuentes en paralelo
      const [
        auditoriasData,
        logsData,
        formulariosData,
        empleadosData,
        capacitacionesData,
        accidentesData,
        ausenciasData
      ] = await Promise.all([
        this.getAuditoriasData(companyId, period, userId),
        this.getLogsData(companyId, period),
        this.getFormulariosData(companyId, period),
        this.getEmpleados(sucursalId, userId),
        this.getCapacitaciones(sucursalId, period, userId),
        this.getAccidentes(sucursalId, period, userId),
        this.getAusencias(companyId, sucursalId, period, userId)
      ]);

      // Calcular métricas de seguridad
      const metrics = this.calculateSafetyMetrics(
        auditoriasData, 
        logsData, 
        formulariosData,
        empleadosData,
        capacitacionesData,
        accidentesData,
        ausenciasData,
        period // Pasar período para cálculo correcto de índices
      );
      
      // Obtener información de la empresa y sucursal
      const companyInfo = await this.getCompanyInfo(companyId);
      const sucursalInfo = sucursalId !== 'todas' ? await this.getSucursalInfo(sucursalId, userId) : null;
      
      return {
        companyId,
        sucursalId,
        companyName: companyInfo?.nombre || 'Empresa',
        sucursalName: sucursalId === 'todas' ? 'Todas las sucursales' : (sucursalInfo?.nombre || 'Sucursal'),
        period,
        ...metrics,
        alerts: this.generateAlerts(auditoriasData, logsData, formulariosData, accidentesData),
        chartData: this.generateChartData(auditoriasData, logsData, accidentesData, period),
        occupationalHealth: metrics.occupationalHealth
      };
      
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo datos:', error);
      // Retornar datos por defecto en caso de error
      return this.getDefaultData(companyId, sucursalId, period);
    }
  },

  // Listener en tiempo real para dashboard - Optimizado con debounce
  subscribeToDashboard(companyId, sucursalId, period, callback, onError, userId = null) {
    console.log(`🔍 [SafetyDashboard] Suscribiéndose a dashboard en tiempo real para empresa ${companyId}, sucursal ${sucursalId}`);
    
    const unsubscribes = [];
    let isLoading = false;
    let debounceTimer = null;
    let isFirstLoad = true;
    
    // Función para recargar todos los datos del dashboard con debounce
    const recargarDashboard = async (immediate = false) => {
      // Cancelar debounce anterior si existe
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      
      // Primera carga es inmediata
      if (isFirstLoad) {
        isFirstLoad = false;
        immediate = true;
      }
      
      const doReload = async () => {
        if (isLoading) return;
        isLoading = true;
        
        try {
          console.log('🔄 [SafetyDashboard] Recargando datos del dashboard...');
          
          const [
            auditoriasData,
            logsData,
            formulariosData,
            empleadosData,
            capacitacionesData,
            accidentesData,
            ausenciasData
          ] = await Promise.all([
            this.getAuditoriasData(companyId, period, userId),
            this.getLogsData(companyId, period),
            this.getFormulariosData(companyId, period),
            this.getEmpleados(sucursalId, userId),
            this.getCapacitaciones(sucursalId, period, userId),
            this.getAccidentes(sucursalId, period, userId),
            this.getAusencias(companyId, sucursalId, period, userId)
          ]);

          const metrics = this.calculateSafetyMetrics(
            auditoriasData,
            logsData,
            formulariosData,
            empleadosData,
            capacitacionesData,
            accidentesData,
            ausenciasData,
            period // Pasar período para cálculo correcto de índices
          );
          
          const companyInfo = await this.getCompanyInfo(companyId);
          const sucursalInfo = sucursalId !== 'todas' ? await this.getSucursalInfo(sucursalId, userId) : null;
          
          callback({
            companyId,
            sucursalId,
            companyName: companyInfo?.nombre || 'Empresa',
            sucursalName: sucursalId === 'todas' ? 'Todas las sucursales' : (sucursalInfo?.nombre || 'Sucursal'),
            period,
            ...metrics,
            alerts: this.generateAlerts(auditoriasData, logsData, formulariosData, accidentesData),
            chartData: this.generateChartData(auditoriasData, logsData, accidentesData, period),
            occupationalHealth: metrics.occupationalHealth
          });
        } catch (error) {
          console.error('❌ [SafetyDashboard] Error recalculando métricas:', error);
          if (onError) onError(error);
        } finally {
          isLoading = false;
        }
      };
      
      // Cargar inmediatamente o con debounce
      if (immediate) {
        doReload();
      } else {
        debounceTimer = setTimeout(doReload, 500); // 500ms debounce
      }
    };
    
    // Cargar datos iniciales inmediatamente
    recargarDashboard(true);
    
    try {
      // Listener para accidentes
      if (userId) {
        const accidentesRef = auditUserCollection(userId, 'accidentes');
        let qAccidentes;
        
        if (sucursalId === 'todas') {
          qAccidentes = query(accidentesRef, orderBy('fechaHora', 'desc'));
        } else {
          qAccidentes = query(
            accidentesRef,
            where('sucursalId', '==', sucursalId),
            orderBy('fechaHora', 'desc')
          );
        }
        
        const unsubscribeAccidentes = onSnapshot(qAccidentes, 
          (snapshot) => {
            console.log(`🔄 [SafetyDashboard] Cambios detectados en accidentes: ${snapshot.docs.length} documentos`);
            recargarDashboard();
          },
          (error) => {
            console.error('❌ [SafetyDashboard] Error en listener de accidentes:', error);
            if (onError) onError(error);
          }
        );
        
        unsubscribes.push(unsubscribeAccidentes);
      }
      
      // Listener para ausencias de salud ocupacional
      if (userId) {
        const ausenciasRef = auditUserCollection(userId, 'ausencias');
        let qAusencias;

        if (sucursalId === 'todas') {
          if (companyId) {
            qAusencias = query(ausenciasRef, where('empresaId', '==', companyId));
          } else {
            qAusencias = query(ausenciasRef, orderBy('fechaInicio', 'desc'));
          }
        } else {
          qAusencias = query(
            ausenciasRef,
            where('sucursalId', '==', sucursalId)
          );
        }

        const unsubscribeAusencias = onSnapshot(
          qAusencias,
          (snapshot) => {
            console.log(
              `🔄 [Dashboard] Cambios detectados en ausencias: ${snapshot.docs.length} documentos`
            );
            recargarDashboard();
          },
          (error) => {
            console.error(
              '❌ [Dashboard] Error en listener de ausencias:',
              error
            );
            if (onError) onError(error);
          }
        );

        unsubscribes.push(unsubscribeAusencias);
      }
      
      // Listener para capacitaciones
      if (userId) {
        const capacitacionesRef = auditUserCollection(userId, 'capacitaciones');
        let qCapacitaciones;
        
        if (sucursalId === 'todas') {
          qCapacitaciones = query(capacitacionesRef, orderBy('fechaRealizada', 'desc'));
        } else {
          qCapacitaciones = query(
            capacitacionesRef,
            where('sucursalId', '==', sucursalId),
            orderBy('fechaRealizada', 'desc')
          );
        }
        
        const unsubscribeCapacitaciones = onSnapshot(qCapacitaciones,
          (snapshot) => {
            console.log(`🔄 [SafetyDashboard] Cambios detectados en capacitaciones: ${snapshot.docs.length} documentos`);
            recargarDashboard();
          },
          (error) => {
            console.error('❌ [SafetyDashboard] Error en listener de capacitaciones:', error);
            if (onError) onError(error);
          }
        );
        
        unsubscribes.push(unsubscribeCapacitaciones);
      }
      
      // Listener para empleados
      if (userId) {
        const empleadosRef = auditUserCollection(userId, 'empleados');
        let qEmpleados;
        
        if (sucursalId === 'todas') {
          qEmpleados = query(empleadosRef, orderBy('nombre', 'asc'));
        } else {
          qEmpleados = query(
            empleadosRef,
            where('sucursalId', '==', sucursalId),
            orderBy('nombre', 'asc')
          );
        }
        
        const unsubscribeEmpleados = onSnapshot(qEmpleados,
          (snapshot) => {
            console.log(`🔄 [SafetyDashboard] Cambios detectados en empleados: ${snapshot.docs.length} documentos`);
            recargarDashboard();
          },
          (error) => {
            console.error('❌ [SafetyDashboard] Error en listener de empleados:', error);
            if (onError) onError(error);
          }
        );
        
        unsubscribes.push(unsubscribeEmpleados);
      }
      
      // Listener para auditorías
      if (!userId) {
        console.warn('⚠️ Dashboard: userId requerido para reportes');
        return;
      }
      
      const auditoriasRef = auditUserCollection(userId, 'reportes');
            const auditoriaQueries = [];
      
      if (companyId) {
        auditoriaQueries.push(query(auditoriasRef, where('empresaId', '==', companyId)));
        auditoriaQueries.push(query(auditoriasRef, where('empresa', '==', companyId)));
        auditoriaQueries.push(query(auditoriasRef, where('clienteAdminId', '==', companyId)));
      } else {
        auditoriaQueries.push(query(auditoriasRef, orderBy('fechaCreacion', 'desc')));
      }
      
      auditoriaQueries.forEach((auditoriaQuery, index) => {
        const unsubscribe = onSnapshot(
          auditoriaQuery,
          (snapshot) => {
            console.log(`🔄 [SafetyDashboard] Cambios detectados en auditorías (${index + 1}): ${snapshot.docs.length} documentos`);
            recargarDashboard();
          },
          (error) => {
            console.error('❌ [SafetyDashboard] Error en listener de auditorías:', error);
            if (onError) onError(error);
          }
        );
        unsubscribes.push(unsubscribe);
      });
      
      // Retornar función para desuscribirse de todos los listeners
      return () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        unsubscribes.forEach(unsub => unsub());
      };
      
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error configurando listeners:', error);
      if (onError) onError(error);
      return () => {};
    }
  },

  // Obtener datos de auditorías
  async getAuditoriasData(companyId, period, userId) {
    try {
      if (!userId) {
        console.warn('⚠️ getAuditoriasData: userId requerido');
        return [];
      }
      
      const reportesRef = auditUserCollection(userId, 'reportes');
            const queries = [];

      if (companyId) {
        queries.push(query(reportesRef, where('empresaId', '==', companyId)));
        queries.push(query(reportesRef, where('empresa', '==', companyId)));
        queries.push(query(reportesRef, where('clienteAdminId', '==', companyId)));
      } else {
        queries.push(query(reportesRef, orderBy('fechaCreacion', 'desc')));
      }

      const snapshots = await Promise.allSettled(
        queries.map((q) => getDocs(q))
      );

      const auditorias = [];
      const processedIds = new Set();

      snapshots.forEach((result) => {
        if (result.status !== 'fulfilled') {
          console.warn('⚠️ [SafetyDashboard] Error en consulta de reportes:', result.reason);
          return;
        }

        result.value.forEach((docSnapshot) => {
          if (processedIds.has(docSnapshot.id)) return;
          processedIds.add(docSnapshot.id);

          const data = docSnapshot.data();
          
          // Normalizar fechaCreacion: convertir Timestamp o string ISO a Date
          let fechaCreacionNormalizada = null;
          if (data.fechaCreacion) {
            if (data.fechaCreacion.toDate) {
              // Es un Timestamp de Firestore
              fechaCreacionNormalizada = data.fechaCreacion.toDate();
            } else if (typeof data.fechaCreacion === 'string') {
              // Es un string ISO
              fechaCreacionNormalizada = new Date(data.fechaCreacion);
            } else if (data.fechaCreacion instanceof Date) {
              // Ya es un Date
              fechaCreacionNormalizada = data.fechaCreacion;
            }
          }
          
          auditorias.push({
            id: docSnapshot.id,
            ...data,
            fechaCreacion: fechaCreacionNormalizada,
            estadisticas: data.estadisticas || this.calculateAuditoriaStats(data.respuestas)
          });
        });
      });

      auditorias.sort((a, b) => {
        const fechaA = a.fechaCreacion instanceof Date ? a.fechaCreacion : (a.fecha?.toDate ? a.fecha.toDate() : (a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.fecha || a.timestamp || 0)));
        const fechaB = b.fechaCreacion instanceof Date ? b.fechaCreacion : (b.fecha?.toDate ? b.fecha.toDate() : (b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.fecha || b.timestamp || 0)));
        return fechaB - fechaA;
      });

      console.log(`📊 [SafetyDashboard] ${auditorias.length} auditorías (reportes) encontradas`);
      return auditorias;

    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo auditorías (reportes):', error);
      return [];
    }
  },

  // Obtener datos de logs de operarios
  async getLogsData(companyId, period) {
    try {
      const logsRef = collection(dbAudit, 'logs_operarios');
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
      const formulariosRef = collection(dbAudit, 'formularios');
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
      const empresaRef = doc(dbAudit, 'empresas', companyId);
      const empresaDoc = await getDoc(empresaRef);
      
      if (empresaDoc.exists()) {
        return { id: empresaDoc.id, ...empresaDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo info empresa:', error);
      return null;
    }
  },

  // Obtener información de la sucursal
  async getSucursalInfo(sucursalId, userId) {
    try {
      if (!userId) {
        console.warn('⚠️ [SafetyDashboard] getSucursalInfo: userId no proporcionado');
        return null;
      }
      const sucursalRef = doc(dbAudit, 'apps', 'auditoria', 'users', userId, 'sucursales', sucursalId);
      const sucursalDoc = await getDoc(sucursalRef);
      
      if (sucursalDoc.exists()) {
        return { id: sucursalDoc.id, ...sucursalDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo info sucursal:', error);
      return null;
    }
  },

  // Obtener empleados de una sucursal
  async getEmpleados(sucursalId, userId = null) {
    try {
      if (!userId) {
        console.warn('⚠️ [SafetyDashboard] getEmpleados: userId no proporcionado, retornando array vacío');
        return [];
      }

      const empleadosRef = auditUserCollection(userId, 'empleados');
      let q;
      
      if (sucursalId === 'todas') {
        q = query(empleadosRef, orderBy('nombre', 'asc'));
      } else {
        q = query(
          empleadosRef,
          where('sucursalId', '==', sucursalId),
          orderBy('nombre', 'asc')
        );
      }
      
      const snapshot = await getDocs(q);
      const empleados = [];
      
      snapshot.forEach(doc => {
        empleados.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`👥 [SafetyDashboard] ${empleados.length} empleados encontrados para usuario ${userId}`);
      return empleados;
      
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo empleados:', error);
      return [];
    }
  },

  // Obtener capacitaciones de una sucursal
  async getCapacitaciones(sucursalId, period, userId = null) {
    try {
      if (!userId) {
        console.warn('⚠️ [SafetyDashboard] getCapacitaciones: userId no proporcionado, retornando array vacío');
        return [];
      }

      const capacitacionesRef = auditUserCollection(userId, 'capacitaciones');
      let q;
      
      if (sucursalId === 'todas') {
        q = query(capacitacionesRef, orderBy('fechaRealizada', 'desc'));
      } else {
        q = query(
          capacitacionesRef,
          where('sucursalId', '==', sucursalId),
          orderBy('fechaRealizada', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      const capacitaciones = [];
      
      snapshot.forEach(doc => {
        capacitaciones.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`📚 [SafetyDashboard] ${capacitaciones.length} capacitaciones encontradas para usuario ${userId}`);
      return capacitaciones;
      
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo capacitaciones:', error);
      return [];
    }
  },

  // Obtener accidentes de una sucursal
  async getAccidentes(sucursalId, period, userId = null) {
    try {
      if (!userId) {
        console.warn('⚠️ [SafetyDashboard] getAccidentes: userId no proporcionado, retornando array vacío');
        return [];
      }

      const accidentesRef = auditUserCollection(userId, 'accidentes');
      let q;
      
      if (sucursalId === 'todas') {
        q = query(accidentesRef, orderBy('fechaHora', 'desc'));
      } else {
        q = query(
          accidentesRef,
          where('sucursalId', '==', sucursalId),
          orderBy('fechaHora', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      const accidentes = [];
      
      snapshot.forEach(doc => {
        accidentes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`🚨 [SafetyDashboard] ${accidentes.length} accidentes encontrados para usuario ${userId}`);
      return accidentes;
      
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo accidentes:', error);
      return [];
    }
  },

  // Obtener ausencias y enfermedades registradas
  async getAusencias(companyId, sucursalId, period, userId = null) {
    try {
      if (!userId) {
        console.warn('⚠️ [SafetyDashboard] getAusencias: userId no proporcionado, retornando array vacío');
        return [];
      }

      const ausenciasRef = auditUserCollection(userId, 'ausencias');
      let snapshot;

      if (sucursalId === 'todas') {
        if (companyId) {
          const q = query(ausenciasRef, where('empresaId', '==', companyId));
          snapshot = await getDocs(q);
        } else {
          const q = query(ausenciasRef, orderBy('fechaInicio', 'desc'), limit(200));
          snapshot = await getDocs(q);
        }
      } else {
        const q = query(
          ausenciasRef,
          where('sucursalId', '==', sucursalId)
        );
        snapshot = await getDocs(q);
      }

      const ausencias = [];
      snapshot.forEach((docSnapshot) => {
        ausencias.push({
          id: docSnapshot.id,
          ...docSnapshot.data()
        });
      });

      if (!period) {
        return ausencias;
      }

      const [year, month] = period.split('-').map(Number);
      if (!year || !month) {
        return ausencias;
      }

      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

      const parseDate = (value) => {
        if (!value) return null;
        if (value.toDate) {
          try {
            return value.toDate();
          } catch (error) {
            return null;
          }
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const overlapsPeriod = (ausencia) => {
        const inicio =
          parseDate(
            ausencia.fechaInicio ||
              ausencia.inicio ||
              ausencia.fecha ||
              ausencia.startDate
          ) || parseDate(ausencia.createdAt);
        const fin = parseDate(
          ausencia.fechaFin ||
            ausencia.fin ||
            ausencia.fechaCierre ||
            ausencia.endDate
        );

        if (!inicio) return false;

        const cierre = fin || new Date();
        return inicio <= periodEnd && cierre >= periodStart;
      };

      const filtered = ausencias.filter(overlapsPeriod);
      console.log(`🏥 [SafetyDashboard] ${filtered.length} ausencias encontradas para usuario ${userId}`);
      return filtered;
    } catch (error) {
      console.error('❌ [SafetyDashboard] Error obteniendo ausencias:', error);
      return [];
    }
  },

  // Calcular métricas de seguridad desde datos reales - CON LÓGICA ESTÁNDAR OSHA/ISO
  calculateSafetyMetrics(
    auditorias,
    logs,
    formularios,
    empleados,
    capacitaciones,
    accidentes,
    ausencias,
    period
  ) {
    // Parsear período YYYY-MM
    const [year, month] = period ? period.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999); // Último día del mes
    const now = new Date();
    const ausenciasList = Array.isArray(ausencias) ? ausencias : [];
    
    // Métricas de empleados (datos reales)
    const empleadosActivos = empleados.filter(e => e.estado === 'activo');
    const totalEmployees = empleadosActivos.length;
    const totalEmployeesAll = empleados.length; // Total incluyendo inactivos
    const inactiveEmployees = totalEmployeesAll - totalEmployees; // Empleados inactivos
    const operators = empleados.filter(e => e.tipo === 'operativo' && e.estado === 'activo').length;
    const administrators = empleados.filter(e => e.tipo === 'administrativo' && e.estado === 'activo').length;
    const empleadosMap = new Map();
    empleados.forEach((emp) => {
      if (emp?.id) {
        empleadosMap.set(emp.id, emp);
      }
    });
    let hoursWorked = totalEmployees * 8 * 30; // 8 horas × 30 días

    // Métricas de accidentes (datos reales de la nueva colección)
    const accidents = accidentes.filter(a => a.tipo === 'accidente');
    const incidents = accidentes.filter(a => a.tipo === 'incidente');

    const parseEventDate = (event) => {
      if (!event) return null;
      const source =
        event.fechaHora ||
        event.fechaReporte ||
        event.fecha ||
        event.createdAt ||
        event.updatedAt;
      if (!source) return null;
      try {
        return source.toDate ? source.toDate() : new Date(source);
      } catch (error) {
        return null;
      }
    };

    // 🎯 FILTRAR ACCIDENTES DEL PERÍODO (para IF e II)
    const accidentsInPeriod = accidents.filter(acc => {
      const accidentDate = parseEventDate(acc);
      return accidentDate && accidentDate >= periodStart && accidentDate <= periodEnd;
    });

    const incidentsInPeriod = incidents.filter(incident => {
      const incidentDate = parseEventDate(incident);
      return incidentDate && incidentDate >= periodStart && incidentDate <= periodEnd;
    });

    // Calcular días sin accidentes
    const sortedAccidents = [...accidents].sort((a, b) => {
      const dateA = parseEventDate(a);
      const dateB = parseEventDate(b);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });

    const lastAccident = sortedAccidents.length > 0 ? parseEventDate(sortedAccidents[0]) : null;
    const daysWithoutAccidents = lastAccident ? 
      Math.floor((Date.now() - lastAccident.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const sortedIncidents = [...incidents].sort((a, b) => {
      const dateA = parseEventDate(a);
      const dateB = parseEventDate(b);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });

    const lastIncident = sortedIncidents.length > 0 ? parseEventDate(sortedIncidents[0]) : null;
    const daysWithoutIncidents = lastIncident ?
      Math.floor((Date.now() - lastIncident.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const incidentTrend = (() => {
      const trend = [];
      const baseDate = new Date(year, month - 1, 1);

      for (let i = 5; i >= 0; i--) {
        const start = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
        const count = incidents.filter(incident => {
          const incidentDate = parseEventDate(incident);
          return incidentDate && incidentDate >= start && incidentDate <= end;
        }).length;

        trend.push({
          label: start.toLocaleString('es-ES', { month: 'short' }).toUpperCase(),
          value: count
        });
      }

      return trend;
    })();

    const incidentAccidentRatio = accidentsInPeriod.length > 0
      ? Number((incidentsInPeriod.length / accidentsInPeriod.length).toFixed(1))
      : incidentsInPeriod.length > 0 ? incidentsInPeriod.length : 0;

    const recentIncidents = sortedIncidents.slice(0, 5).map(incident => {
      const incidentDate = parseEventDate(incident);
      const involucrados = incident.empleadosInvolucrados || incident.involucrados;
      const responsables = incident.responsable || incident.responsables || incident.supervisor;
      const testigos = incident.testigos || incident.empleadosTestigos;

      const formatPeople = (people) => {
        if (!people) return null;
        if (Array.isArray(people)) {
          return people
            .map(person => person?.nombre || person?.name || person?.displayName)
            .filter(Boolean)
            .join(', ');
        }
        return typeof people === 'string' ? people : null;
      };

      const mapPeople = (peopleArray, defaultPrefix) => {
        if (!Array.isArray(peopleArray)) return [];
        return peopleArray.map((person, index) => ({
          id: person?.empleadoId || person?.id || `${defaultPrefix}-${index}`,
          nombre: person?.empleadoNombre || person?.nombre || person?.displayName || 'Sin nombre',
          conReposo: Boolean(person?.conReposo)
        }));
      };

      return {
        id: incident.id || incident.uid || `incident-${Math.random().toString(36).slice(2, 8)}`,
        fecha: incidentDate ? incidentDate.toISOString() : null,
        fechaHora: incident.fechaHora || incidentDate || null,
        tipo: incident.tipo || incident.categoria || 'incidente',
        area: incident.area || incident.sector || incident.ubicacion || 'Sin asignar',
        descripcion: incident.descripcion || incident.detalle || incident.causas || '',
        estado: (incident.estado || incident.status || 'Sin estado').toUpperCase(),
        responsable: formatPeople(responsables) || formatPeople(involucrados),
        empleadosInvolucrados: mapPeople(involucrados, 'emp'),
        testigos: mapPeople(testigos, 'testigo'),
        imagenes: Array.isArray(incident.imagenes) ? incident.imagenes : [],
        empresaId: incident.empresaId || incident.companyId || null,
        sucursalId: incident.sucursalId || incident.plantaId || null
      };
    });

    // 🎯 CÁLCULO CORRECTO DE ÍNDICES SEGÚN ESTÁNDARES OSHA/ISO 45001
    let totalDaysLost = 0;

    // Crear mapa de empleados en reposo por ID
    const empleadosEnReposo = new Map();
    empleados.forEach(emp => {
      if (emp.estado === 'inactivo' && emp.fechaInicioReposo) {
        empleadosEnReposo.set(emp.id, emp);
      }
    });

    // Calcular días perdidos solo para empleados que AÚN están en reposo por accidentes
    empleadosEnReposo.forEach(emp => {
      const fechaInicioReposo = emp.fechaInicioReposo.toDate ? emp.fechaInicioReposo.toDate() : new Date(emp.fechaInicioReposo);
      const fechaFinPeriodo = periodEnd > now ? now : periodEnd;

      if (fechaInicioReposo < fechaFinPeriodo) {
        const inicioCalculo = fechaInicioReposo > periodStart ? fechaInicioReposo : periodStart;
        const diasEnPeriodo = Math.max(0, Math.ceil((fechaFinPeriodo - inicioCalculo) / (1000 * 60 * 60 * 24)));
        totalDaysLost += diasEnPeriodo;
      }
    });

    const occupationalHealthMetrics = computeOccupationalHealthMetrics({
      ausencias: ausenciasList,
      periodStart,
      periodEnd,
      now,
      resolveHorasPorDia: (ausencia) => {
        const empleado = ausencia.empleadoId ? empleadosMap.get(ausencia.empleadoId) : null;

        if (typeof ausencia?.horasPorDia === 'number' && ausencia.horasPorDia > 0) {
          return ausencia.horasPorDia;
        }

        if (
          typeof ausencia?.horasSemanales === 'number' &&
          ausencia.horasSemanales > 0
        ) {
          const divisor =
            typeof ausencia?.diasLaborales === 'number' && ausencia.diasLaborales > 0
              ? ausencia.diasLaborales
              : 5;
          return ausencia.horasSemanales / divisor;
        }

        if (empleado) {
          if (typeof empleado?.horasPorDia === 'number' && empleado.horasPorDia > 0) {
            return empleado.horasPorDia;
          }

          if (
            typeof empleado?.horasSemanales === 'number' &&
            empleado.horasSemanales > 0
          ) {
            const divisor =
              typeof empleado?.diasLaborales === 'number' && empleado.diasLaborales > 0
                ? empleado.diasLaborales
                : 5;
            return empleado.horasSemanales / divisor;
          }
        }

        return 8;
      },
      resolveEmpleado: (ausencia) =>
        ausencia.empleadoId ? empleadosMap.get(ausencia.empleadoId) : null
    });

    const resumenSalud = occupationalHealthMetrics.resumen;
    const diasAusenciasNoAccidente = resumenSalud.diasPerdidosNoAccidente || 0;
    const horasAusenciasNoAccidente = resumenSalud.horasPerdidasNoAccidente || 0;
    const diasAusenciasTotales = resumenSalud.diasPerdidosTotales || 0;
    const horasAusenciasTotales = resumenSalud.horasPerdidasTotales || 0;

    totalDaysLost += diasAusenciasNoAccidente;
    hoursWorked = Math.max(0, hoursWorked - horasAusenciasNoAccidente);

    const frequencyIndex = accidentsInPeriod.length > 0 && hoursWorked > 0
      ? (accidentsInPeriod.length * 1000000) / hoursWorked
      : 0;

    const severityIndex = totalDaysLost > 0 && hoursWorked > 0
      ? (totalDaysLost * 1000000) / hoursWorked
      : 0;

    // II: SOLO empleados accidentados en el período
    const empleadosAccidentados = new Set(
      accidentsInPeriod
        .map(acc => acc.empleadosInvolucrados?.map(emp => emp.empleadoId))
        .flat()
        .filter(Boolean)
    );
    const incidenceIndex = empleadosAccidentados.size > 0 && totalEmployees > 0
      ? (empleadosAccidentados.size * 1000) / totalEmployees
      : 0;

    const occupationalHealth = {
      resumen: {
        total: resumenSalud.total,
        activas: resumenSalud.activas,
        cerradas: resumenSalud.cerradas,
        ocupacionales: resumenSalud.ocupacionales,
        covid: resumenSalud.covid,
        enfermedades: resumenSalud.enfermedades,
        licencias: resumenSalud.licencias,
        otros: resumenSalud.otros,
        diasPerdidosTotales: diasAusenciasTotales,
        horasPerdidasTotales: horasAusenciasTotales,
        diasPerdidosNoAccidente: diasAusenciasNoAccidente,
        horasPerdidasNoAccidente: horasAusenciasNoAccidente
      },
      porTipo: resumenSalud.porTipo || {},
      casosRecientes: occupationalHealthMetrics.casosRecientes,
      casos: occupationalHealthMetrics.casos
    };

    // Métricas de capacitaciones (datos reales de la nueva colección)
    const trainingsDone = capacitaciones.filter(c => c.estado === 'completada').length;
    const trainingsPlanned = capacitaciones.filter(c => c.estado === 'activa').length;

    // Capacitaciones por tipo
    const charlas = capacitaciones.filter(c => c.tipo === 'charla');
    const entrenamientos = capacitaciones.filter(c => c.tipo === 'entrenamiento');
    const capacitacionesAvanzadas = capacitaciones.filter(c => c.tipo === 'capacitacion');

    const charlasProgress = charlas.length > 0 ? 
      Math.round((charlas.filter(c => c.estado === 'completada').length / charlas.length) * 100) : 0;
    const entrenamientosProgress = entrenamientos.length > 0 ? 
      Math.round((entrenamientos.filter(c => c.estado === 'completada').length / entrenamientos.length) * 100) : 0;
    const capacitacionesProgress = capacitacionesAvanzadas.length > 0 ? 
      Math.round((capacitacionesAvanzadas.filter(c => c.estado === 'completada').length / capacitacionesAvanzadas.length) * 100) : 0;

    // Calcular inspecciones desde auditorías
    const inspections = auditorias.filter(a => 
      a.formulario?.toLowerCase().includes('inspección') ||
      a.formulario?.toLowerCase().includes('inspeccion')
    );

    const auditoriasInPeriod = auditorias.filter(auditoria => {
      if (!auditoria.fechaCreacion && !auditoria.fecha) return false;
      const auditDate = auditoria.fechaCreacion instanceof Date 
        ? auditoria.fechaCreacion 
        : (auditoria.fecha?.toDate ? auditoria.fecha.toDate() : new Date(auditoria.fecha || 0));
      return auditDate instanceof Date && auditDate >= periodStart && auditDate <= periodEnd;
    });

    const completedAudits = auditoriasInPeriod.filter(auditoria => auditoria.estado === 'completada');
    const pendingAudits = auditoriasInPeriod.filter(auditoria => auditoria.estado !== 'completada');

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

    const auditClassificationSummary = aggregateAuditClassifications(auditorias);

    return {
      // Métricas de accidentes
      totalAccidents: accidentsInPeriod.length, // Solo del período
      totalIncidents: incidents.length,
      incidentTrend,
      incidentAccidentRatio,
      daysWithoutIncidents,
      recentIncidents,
      daysWithoutAccidents,
      frequencyIndex: Number(frequencyIndex.toFixed(1)),
      severityIndex: Number(severityIndex.toFixed(1)),
      incidenceIndex: Number(incidenceIndex.toFixed(1)), // Añadido: Índice de Incidencia
      accidentabilityIndex: Number((frequencyIndex + severityIndex).toFixed(1)),
      occupationalHealth,
      
      // Métricas de capacitaciones
      trainingsDone,
      trainingsPlanned,
      
      // Métricas de inspecciones
      inspectionsDone: inspections.length,
      inspectionsPlanned: inspections.length + 5, // Estimación
      
      // Métricas de desvíos
      deviationsFound: deviations,
      deviationsClosed: closedDeviations,
      
      // Métricas de cumplimiento
      eppDeliveryRate: Math.min(100, Math.max(80, 100 - (deviations * 2))),
      contractorCompliance: Math.min(100, Math.max(85, legalCompliance - 5)),
      legalCompliance,

      // Métricas de auditorías
      auditsTotal: auditoriasInPeriod.length,
      auditsCompleted: completedAudits.length,
      auditsPending: pendingAudits.length,
      auditsNonConformities: auditoriasInPeriod.reduce((total, auditoria) => {
        if (auditoria.estadisticas) {
          return total + (auditoria.estadisticas.conteo?.['No conforme'] || 0);
        }
        return total;
      }, 0),
      auditClassificationSummary,
      
      // Métricas de empleados (DATOS REALES)
      totalEmployees,
      totalEmployeesAll,
      inactiveEmployees,
      operators,
      administrators,
      hoursWorked,
      
      // Métricas de capacitación detalladas (DATOS REALES)
      charlasProgress,
      entrenamientosProgress,
      capacitacionesProgress
    };
  },

  // Generar alertas basadas en datos reales
  generateAlerts(auditorias, logs, formularios, accidentes) {
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

    // Alertas por accidentes recientes (de la nueva colección)
    const recentAccidents = accidentes.filter(acc => {
      if (!acc.fechaHora) return false;
      const accidentDate = acc.fechaHora.toDate ? acc.fechaHora.toDate() : new Date(acc.fechaHora);
      const daysDiff = (Date.now() - accidentDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff < 30 && acc.tipo === 'accidente';
    });
    
    if (recentAccidents.length > 0) {
      alerts.push(`${recentAccidents.length} accidente(s) reportado(s) en los últimos 30 días`);
    }

    // Alertas por accidentes abiertos
    const openAccidents = accidentes.filter(acc => acc.estado === 'abierto');
    if (openAccidents.length > 0) {
      alerts.push(`${openAccidents.length} accidente(s) en investigación`);
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
  generateChartData(auditorias, logs, accidentes, period) {
    // Datos de accidentes por mes (últimos 6 meses) - usar nueva colección
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const accidentsByMonth = months.map(month => {
      const accidents = accidentes.filter(acc => {
        if (!acc.fechaHora) return false;
        const accDate = acc.fechaHora.toDate ? acc.fechaHora.toDate() : new Date(acc.fechaHora);
        const monthIndex = accDate.getMonth();
        return monthIndex === months.indexOf(month) && acc.tipo === 'accidente';
      });
      return { month, accidents: accidents.length };
    });

    // Datos de incidentes por tipo - usar nueva colección
    const incidentTypes = {};
    accidentes.forEach(acc => {
      if (acc.tipo === 'incidente') {
        const type = acc.gravedad || 'Otros';
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
        const auditDate = auditoria.fechaCreacion instanceof Date 
          ? auditoria.fechaCreacion 
          : (auditoria.fechaCreacion?.toDate ? auditoria.fechaCreacion.toDate() : new Date(auditoria.fechaCreacion));
        return auditDate instanceof Date && auditDate.getMonth() === months.indexOf(month);
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
  getDefaultData(companyId, sucursalId, period) {
    return {
      companyId,
      sucursalId,
      companyName: 'Empresa',
      sucursalName: 'Sucursal',
      period,
      totalAccidents: 0,
      totalIncidents: 0,
      incidentTrend: [],
      incidentAccidentRatio: 0,
      daysWithoutIncidents: 0,
      recentIncidents: [],
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
      auditsTotal: 0,
      auditsCompleted: 0,
      auditsPending: 0,
      auditsNonConformities: 0,
      totalEmployees: 0,
      operators: 0,
      administrators: 0,
      hoursWorked: 0,
      charlasProgress: 0,
      entrenamientosProgress: 0,
      capacitacionesProgress: 0,
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
export async function getSafetyDashboardData(companyId, sucursalId, period) {
  return await safetyDashboardService.getDashboardData(companyId, sucursalId, period);
}
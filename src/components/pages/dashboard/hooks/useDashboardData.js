import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/context/AuthContext';
import { auditoriaService } from '../../../../services/auditoriaService';
import { obtenerAccidentes } from '../../../../services/accidenteService';
import { capacitacionService } from '../../../../services/capacitacionService';
import autoSaveService from '../../../pages/auditoria/auditoria/services/autoSaveService';

/**
 * Hook central para reunir datos del dashboard
 * Reutiliza servicios existentes sin duplicar lógica
 */
export const useDashboardData = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    todayTasks: [],
    blockedItems: [],
    alerts: [],
    summary: {
      auditoriasMes: 0,
      accidentesAbiertos: 0,
      capacitacionesPendientes: 0,
      auditoriasOffline: 0
    }
  });

  useEffect(() => {
    if (!user || !userProfile?.ownerId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        // Cargar datos en paralelo
        const [
          auditorias,
          accidentes,
          capacitaciones,
          offlineAuditorias
        ] = await Promise.all([
          loadAuditorias(),
          loadAccidentes(),
          loadCapacitaciones(),
          loadOfflineAuditorias()
        ]);

        // Procesar datos para el dashboard
        const todayTasks = getTodayTasks(auditorias, capacitaciones);
        const blockedItems = getBlockedItems(auditorias, accidentes, capacitaciones, offlineAuditorias);
        const alerts = getAlerts(accidentes, capacitaciones);
        const summary = getSummary(auditorias, accidentes, capacitaciones, offlineAuditorias);

        setData({
          todayTasks,
          blockedItems,
          alerts,
          summary
        });
      } catch (error) {
        console.error('[useDashboardData] Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, userProfile]);

  // Cargar auditorías
  const loadAuditorias = async () => {
    try {
      if (!userProfile?.ownerId) return [];
      return await auditoriaService.getUserAuditorias(user?.uid, userProfile?.role, userProfile);
    } catch (error) {
      console.error('[useDashboardData] Error cargando auditorías:', error);
      return [];
    }
  };

  // Cargar accidentes
  const loadAccidentes = async () => {
    try {
      if (!userProfile?.ownerId) return [];
      return await obtenerAccidentes({}, userProfile);
    } catch (error) {
      console.error('[useDashboardData] Error cargando accidentes:', error);
      return [];
    }
  };

  // Cargar capacitaciones
  const loadCapacitaciones = async () => {
    try {
      if (!userProfile?.ownerId) return [];
      return await capacitacionService.getAllCapacitaciones(userProfile.ownerId);
    } catch (error) {
      console.error('[useDashboardData] Error cargando capacitaciones:', error);
      return [];
    }
  };

  // Cargar auditorías offline
  const loadOfflineAuditorias = async () => {
    try {
      if (!user?.uid) return [];
      return await autoSaveService.getOfflineAuditorias(user.uid);
    } catch (error) {
      console.error('[useDashboardData] Error cargando auditorías offline:', error);
      return [];
    }
  };

  // Obtener tareas de hoy
  const getTodayTasks = (auditorias, capacitaciones) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const tasks = [];

    // Auditorías pendientes de hoy
    const auditoriasHoy = auditorias.filter(aud => {
      const fecha = aud.fecha || aud.timestamp?.toDate?.()?.toISOString().split('T')[0];
      const estado = (aud.estado || '').toLowerCase();
      return fecha === todayStr && estado !== 'completada';
    });

    auditoriasHoy.forEach(aud => {
      tasks.push({
        id: `aud-${aud.id}`,
        type: 'auditoria',
        title: `Auditoría: ${aud.sucursalNombre || aud.sucursal || 'Sin sucursal'}`,
        description: aud.formularioNombre || aud.formulario || 'Sin formulario',
        priority: 'high',
        action: `/auditoria/${aud.id}`
      });
    });

    // Capacitaciones activas sin asistencias
    const capacitacionesPendientes = capacitaciones.filter(cap => {
      const estado = (cap.estado || '').toLowerCase();
      const activa = cap.activa !== false;
      const tieneAsistencias = cap.empleados && Array.isArray(cap.empleados) && cap.empleados.length > 0;
      return activa && estado !== 'completada' && !tieneAsistencias;
    });

    capacitacionesPendientes.slice(0, 5).forEach(cap => {
      tasks.push({
        id: `cap-${cap.id}`,
        type: 'capacitacion',
        title: `Capacitación: ${cap.nombre || 'Sin nombre'}`,
        description: cap.tipo || 'Sin tipo',
        priority: 'medium',
        action: `/capacitaciones/${cap.id}`
      });
    });

    return tasks;
  };

  // Obtener items bloqueados/trabados
  const getBlockedItems = (auditorias, accidentes, capacitaciones, offlineAuditorias) => {
    const blocked = [];

    // Auditorías offline pendientes de sync
    offlineAuditorias.forEach(aud => {
      blocked.push({
        id: `offline-${aud.id}`,
        type: 'auditoria_offline',
        title: `Auditoría offline: ${aud.sucursalNombre || 'Sin sucursal'}`,
        description: 'Pendiente de sincronización',
        priority: 'high',
        action: '/auditoria'
      });
    });

    // Accidentes abiertos
    const accidentesAbiertos = accidentes.filter(acc => acc.estado === 'abierto');
    accidentesAbiertos.slice(0, 5).forEach(acc => {
      blocked.push({
        id: `acc-${acc.id}`,
        type: 'accidente',
        title: `Accidente abierto: ${acc.tipo || 'Sin tipo'}`,
        description: acc.sucursalNombre || acc.sucursal || 'Sin sucursal',
        priority: 'high',
        action: `/accidentes?accidenteId=${acc.id}`
      });
    });

    // Capacitaciones activas sin cerrar
    const capacitacionesAbiertas = capacitaciones.filter(cap => {
      const estado = (cap.estado || '').toLowerCase();
      return cap.activa && estado !== 'completada';
    });

    capacitacionesAbiertas.slice(0, 5).forEach(cap => {
      blocked.push({
        id: `cap-blocked-${cap.id}`,
        type: 'capacitacion',
        title: `Capacitación sin cerrar: ${cap.nombre || 'Sin nombre'}`,
        description: 'Requiere atención',
        priority: 'medium',
        action: `/capacitaciones/${cap.id}`
      });
    });

    return blocked;
  };

  // Obtener alertas
  const getAlerts = (accidentes, capacitaciones) => {
    const alerts = [];

    // Accidentes abiertos (problema activo)
    const accidentesAbiertos = accidentes.filter(acc => acc.estado === 'abierto');
    if (accidentesAbiertos.length > 0) {
      alerts.push({
        id: 'accidentes-abiertos',
        type: 'error',
        title: `${accidentesAbiertos.length} accidente${accidentesAbiertos.length > 1 ? 's' : ''} abierto${accidentesAbiertos.length > 1 ? 's' : ''}`,
        description: 'Requieren atención inmediata',
        action: '/accidentes?estado=abierto'
      });
    }

    // Capacitaciones vencidas (más de 365 días sin renovar)
    const hoy = new Date();
    const capacitacionesVencidas = capacitaciones.filter(cap => {
      if (!cap.fechaRealizada) return false;
      const fecha = cap.fechaRealizada?.toDate?.() || new Date(cap.fechaRealizada);
      const diasDesdeUltima = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
      return diasDesdeUltima > 365;
    });

    if (capacitacionesVencidas.length > 0) {
      alerts.push({
        id: 'capacitaciones-vencidas',
        type: 'warning',
        title: `${capacitacionesVencidas.length} capacitación${capacitacionesVencidas.length > 1 ? 'es' : ''} vencida${capacitacionesVencidas.length > 1 ? 's' : ''}`,
        description: 'Más de 365 días sin renovar',
        action: '/capacitaciones'
      });
    }

    // Capacitaciones activas sin asistencias
    const capacitacionesSinAsistencias = capacitaciones.filter(cap => {
      const activa = cap.activa !== false;
      const estado = (cap.estado || '').toLowerCase();
      const tieneAsistencias = cap.empleados && Array.isArray(cap.empleados) && cap.empleados.length > 0;
      return activa && estado !== 'completada' && !tieneAsistencias;
    });

    if (capacitacionesSinAsistencias.length > 0) {
      alerts.push({
        id: 'capacitaciones-sin-asistencias',
        type: 'info',
        title: `${capacitacionesSinAsistencias.length} capacitación${capacitacionesSinAsistencias.length > 1 ? 'es' : ''} sin asistencias`,
        description: 'Requieren registro de asistencia',
        action: '/capacitaciones'
      });
    }

    return alerts;
  };

  // Obtener resumen
  const getSummary = (auditorias, accidentes, capacitaciones, offlineAuditorias) => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

    // Auditorías del mes
    const auditoriasMes = auditorias.filter(aud => {
      const fecha = aud.timestamp?.toDate?.() || aud.fechaCreacion?.toDate?.() || new Date(aud.fecha || 0);
      return fecha >= inicioMes && fecha <= finMes;
    }).length;

    // Accidentes abiertos
    const accidentesAbiertos = accidentes.filter(acc => acc.estado === 'abierto').length;

    // Capacitaciones pendientes
    const capacitacionesPendientes = capacitaciones.filter(cap => {
      const estado = (cap.estado || '').toLowerCase();
      return cap.activa && estado !== 'completada';
    }).length;

    return {
      auditoriasMes,
      accidentesAbiertos,
      capacitacionesPendientes,
      auditoriasOffline: offlineAuditorias.length
    };
  };

  return {
    ...data,
    loading
  };
};

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { empleadoService } from '../../services/empleadoService';
import { trainingPlanService } from '../../services/training/trainingPlanService';
import { trainingSessionService } from '../../services/training/trainingSessionService';
import { trainingAttendanceService } from '../../services/training/trainingAttendanceService';
import { trainingCatalogService } from '../../services/training/trainingCatalogService';
import {
  TRAINING_SESSION_STATUSES,
  TRAINING_ATTENDANCE_STATUSES,
  TRAINING_EVALUATION_STATUSES
} from '../../types/trainingDomain';

export const CELL_STATE = {
  BLANK: 'BLANK',
  RED: 'RED',
  GREEN: 'GREEN',
  GRAY: 'GRAY'
};

const IN_PROGRESS_STATUSES = new Set([
  TRAINING_SESSION_STATUSES.SCHEDULED,
  TRAINING_SESSION_STATUSES.IN_PROGRESS,
  TRAINING_SESSION_STATUSES.PENDING_CLOSURE
]);

const ABSENT_STATUSES = new Set([
  TRAINING_ATTENDANCE_STATUSES.JUSTIFIED_ABSENCE,
  TRAINING_ATTENDANCE_STATUSES.UNJUSTIFIED_ABSENCE,
  // compat legacy (por si existen registros viejos)
  'absent'
]);

function getEmployeeName(emp) {
  if (!emp) return '';
  if (emp.displayName) return emp.displayName;
  if (emp.nombreCompleto) return emp.nombreCompleto;
  const full = [emp.apellido, emp.nombre].filter(Boolean).join(', ');
  return full || emp.email || emp.id || '';
}

/**
 * Hook que carga y computa la matriz de capacitaciones para una sucursal y año.
 *
 * @param {{ ownerId: string, sucursalId: string, year: number, companyId?: string }} params
 * @returns {{
 *   columnsByMonth: Object,
 *   rows: Array,
 *   planId: string|null,
 *   sessions: Array,
 *   sessionByPlanItem: Object,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: () => void
 * }}
 */
export function useTrainingMatrix({ ownerId, sucursalId, year, companyId }) {
  const [empleados, setEmpleados] = useState([]);
  const [plan, setPlan] = useState(null);
  const [planItems, setPlanItems] = useState([]);
  const [sessions, setSessions] = useState([]);
  // { sessionId: { empleadoId: attendanceRecord } }
  const [attendanceMap, setAttendanceMap] = useState({});
  // { trainingTypeId: { id, name, ... } }
  const [catalogMap, setCatalogMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!ownerId || !sucursalId || !year) return;

    setLoading(true);
    setError(null);

    try {
      const [emps, plans, catalogItems] = await Promise.all([
        empleadoService.getEmpleadosBySucursal(ownerId, sucursalId),
        trainingPlanService.listPlans(ownerId, { branchId: sucursalId, year: Number(year) }),
        trainingCatalogService.listAll(ownerId)
      ]);

      const newCatalogMap = {};
      (catalogItems || []).forEach(item => { newCatalogMap[item.id] = item; });

      let activePlan = (plans || [])[0] || null;

      // Si no existe plan anual, crear uno automáticamente
      if (!activePlan) {
        try {
          const createdPlan = await trainingPlanService.createPlan(ownerId, {
            companyId: companyId || undefined,
            branchId: sucursalId,
            year: Number(year),
            status: 'draft',
            notes: 'Plan anual auto-creado'
          });
          activePlan = createdPlan || null;
        } catch (err) {
          console.error('Error creando plan anual:', err);
          // Si falla la creación, continuar sin plan
        }
      }

      // Si aún no hay plan, retornar con empleados pero sin datos de matriz
      if (!activePlan) {
        setEmpleados(emps || []);
        setPlan(null);
        setPlanItems([]);
        setSessions([]);
        setAttendanceMap({});
        setCatalogMap(newCatalogMap);
        return;
      }

      const items = await trainingPlanService.listPlanItems(ownerId, { planId: activePlan.id });

      // Load sessions for the whole year for this branch
      const dateFrom = Timestamp.fromDate(new Date(Number(year), 0, 1));
      const dateTo = Timestamp.fromDate(new Date(Number(year), 11, 31, 23, 59, 59));
      const sessionsList = await trainingSessionService.listSessions(ownerId, {
        branchId: sucursalId,
        dateFrom,
        dateTo
      });

      // Keep only sessions related to this plan's items (by planItemId or trainingTypeId+periodMonth)
      const planItemIds = new Set((items || []).map(i => i.id));
      const itemByTypeAndMonth = {};
      (items || []).forEach(item => {
        const key = `${item.trainingTypeId}_${item.plannedMonth}`;
        if (!itemByTypeAndMonth[key]) itemByTypeAndMonth[key] = item;
      });

      const relevantSessions = (sessionsList || []).filter(s => {
        if (s.planItemId && planItemIds.has(s.planItemId)) return true;
        const key = `${s.trainingTypeId}_${s.periodMonth}`;
        return Boolean(itemByTypeAndMonth[key]);
      });

      // Load attendance for all relevant sessions in parallel
      const attendanceResults = await Promise.all(
        relevantSessions.map(async session => {
          try {
            const records = await trainingAttendanceService.listAttendanceBySession(ownerId, session.id);
            return { sessionId: session.id, records: records || [] };
          } catch {
            return { sessionId: session.id, records: [] };
          }
        })
      );

      const newAttendanceMap = {};
      attendanceResults.forEach(({ sessionId, records }) => {
        newAttendanceMap[sessionId] = {};
        records.forEach(record => {
          newAttendanceMap[sessionId][record.employeeId] = record;
        });
      });

      setEmpleados(emps || []);
      setPlan(activePlan);
      setPlanItems(items || []);
      setSessions(relevantSessions);
      setAttendanceMap(newAttendanceMap);
      setCatalogMap(newCatalogMap);
    } catch (err) {
      setError(err?.message || 'Error al cargar la matriz');
    } finally {
      setLoading(false);
    }
  }, [ownerId, sucursalId, year, companyId]);

  useEffect(() => { load(); }, [load]);

  // Columns grouped by month: { month: [{ planItemId, trainingTypeId, name, noAplicaEmployeeIds }] }
  const columnsByMonth = useMemo(() => {
    const result = {};
    planItems.forEach(item => {
      const month = item.plannedMonth;
      if (!month) return;
      if (!result[month]) result[month] = [];
      result[month].push({
        planItemId: item.id,
        trainingTypeId: item.trainingTypeId,
        name: catalogMap[item.trainingTypeId]?.name || item.trainingTypeId || '—',
        noAplicaEmployeeIds: item.noAplicaEmployeeIds || []
      });
    });
    return result;
  }, [planItems, catalogMap]);

  // Best session per planItem: { planItemId: session }
  // Sessions list is desc by scheduledDate, so first match = most recent
  const sessionByPlanItem = useMemo(() => {
    const map = {};
    sessions.forEach(session => {
      if (session.planItemId && !map[session.planItemId]) {
        map[session.planItemId] = session;
        return;
      }
      // Ad-hoc: match by trainingTypeId + periodMonth
      const matchedItem = planItems.find(item =>
        item.trainingTypeId === session.trainingTypeId &&
        item.plannedMonth === session.periodMonth
      );
      if (matchedItem && !map[matchedItem.id]) {
        map[matchedItem.id] = session;
      }
    });
    return map;
  }, [sessions, planItems]);

  // Sessions grouped by planItemId: { planItemId: session[] }
  const sessionsByPlanItem = useMemo(() => {
    const byKey = {};
    const itemByTypeAndMonth = {};
    planItems.forEach((item) => {
      const key = `${item.trainingTypeId}_${item.plannedMonth}`;
      if (!itemByTypeAndMonth[key]) itemByTypeAndMonth[key] = item;
    });

    sessions.forEach((session) => {
      let planItemId = session.planItemId || null;
      if (!planItemId) {
        const key = `${session.trainingTypeId}_${session.periodMonth}`;
        planItemId = itemByTypeAndMonth[key]?.id || null;
      }
      if (!planItemId) return;
      if (!byKey[planItemId]) byKey[planItemId] = [];
      byKey[planItemId].push(session);
    });

    // Mantener orden (más reciente primero) como viene en `sessions`
    return byKey;
  }, [sessions, planItems]);

  // Compute state for a single (empleadoId, planItem) pair
  // Returns: { estado: 'BLANK'|'RED'|'GREEN'|'GRAY', sessionIds: string[], isTerminal: boolean }
  const computeCellData = useCallback((empleadoId, planItem) => {
    const { planItemId, noAplicaEmployeeIds } = planItem;

    // Plan item explícitamente no aplica para el empleado: terminal GRAY sin sesiones.
    if (noAplicaEmployeeIds && noAplicaEmployeeIds.includes(empleadoId)) {
      return { estado: CELL_STATE.GRAY, sessionIds: [], isTerminal: true };
    }

    const sessionsForItem = sessionsByPlanItem[planItemId] || [];
    if (!sessionsForItem.length) {
      return { estado: CELL_STATE.BLANK, sessionIds: [], isTerminal: false };
    }

    const records = [];
    const sessionIds = [];

    sessionsForItem.forEach((session) => {
      const attendance = attendanceMap[session.id]?.[empleadoId];
      if (!attendance) return;
      records.push(attendance);
      sessionIds.push(session.id);
    });

    // Sin registros → BLANK
    if (!records.length) {
      return { estado: CELL_STATE.BLANK, sessionIds: [], isTerminal: false };
    }

    // Si alguno PRESENT → GREEN (terminal)
    const hasPresent = records.some((r) =>
      r?.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT
    );
    if (hasPresent) {
      return { estado: CELL_STATE.GREEN, sessionIds, isTerminal: true };
    }

    // Si alguno NOT_APPLICABLE → GRAY (terminal)
    const hasNotApplicable = records.some((r) =>
      r?.evaluationStatus === TRAINING_EVALUATION_STATUSES.NOT_APPLICABLE ||
      r?.attendanceStatus === TRAINING_EVALUATION_STATUSES.NOT_APPLICABLE // compat por si alguien lo grabó mal
    );
    if (hasNotApplicable) {
      return { estado: CELL_STATE.GRAY, sessionIds, isTerminal: true };
    }

    // Si todos (los registros explícitos) son no-present y alguno es ausencia → RED
    const hasAbsent = records.some((r) => ABSENT_STATUSES.has(r?.attendanceStatus));
    if (hasAbsent) {
      return { estado: CELL_STATE.RED, sessionIds, isTerminal: false };
    }

    // Invitado/reprogramado/etc sin “ausente” explícito → BLANK (no hay ausencias implícitas)
    return { estado: CELL_STATE.BLANK, sessionIds, isTerminal: false };
  }, [sessionsByPlanItem, attendanceMap]);

  // Rows: one per employee, with cellMap per planItem
  const rows = useMemo(() => {
    const allPlanItems = Object.values(columnsByMonth).flat();
    return empleados.map(emp => {
      const cellMap = {};
      allPlanItems.forEach(planItem => {
        cellMap[planItem.planItemId] = computeCellData(emp.id, planItem);
      });

      // % completo: count GREEN / (total - GRAY)
      const relevant = allPlanItems.filter((pi) =>
        cellMap[pi.planItemId]?.estado !== CELL_STATE.GRAY
      );
      const completed = relevant.filter((pi) =>
        cellMap[pi.planItemId]?.estado === CELL_STATE.GREEN
      ).length;
      const pct = relevant.length > 0
        ? Math.round((completed / relevant.length) * 100)
        : 0;

      return {
        empleadoId: emp.id,
        nombre: getEmployeeName(emp),
        cellMap,
        pct
      };
    });
  }, [empleados, columnsByMonth, computeCellData]);

  return {
    columnsByMonth,
    rows,
    planId: plan?.id || null,
    plan,
    sessions,
    sessionByPlanItem,
    attendanceMap,
    catalogMap,
    loading,
    error,
    refresh: load
  };
}

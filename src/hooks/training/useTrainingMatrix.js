import { useState, useEffect, useCallback, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { empleadoService } from '../../services/empleadoService';
import { trainingPlanService } from '../../services/training/trainingPlanService';
import { trainingSessionService } from '../../services/training/trainingSessionService';
import { trainingAttendanceService } from '../../services/training/trainingAttendanceService';
import { trainingCatalogService } from '../../services/training/trainingCatalogService';
import {
  TRAINING_SESSION_STATUSES,
  TRAINING_ATTENDANCE_STATUSES
} from '../../types/trainingDomain';

export const CELL_STATE = {
  NOT_TRAINED: 0,
  IN_PROGRESS: 1,
  COMPLETE: 2,
  NOT_APPLICABLE: 'N/A'
};

const IN_PROGRESS_STATUSES = new Set([
  TRAINING_SESSION_STATUSES.SCHEDULED,
  TRAINING_SESSION_STATUSES.IN_PROGRESS,
  TRAINING_SESSION_STATUSES.PENDING_CLOSURE
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
 * @param {{ ownerId: string, sucursalId: string, year: number }} params
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
export function useTrainingMatrix({ ownerId, sucursalId, year }) {
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

      const activePlan = (plans || [])[0] || null;

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
  }, [ownerId, sucursalId, year]);

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

  // Compute state for a single (empleadoId, planItem) pair
  // Returns: { estado: CELL_STATE, sessionId: string|null }
  const computeCellState = useCallback((empleadoId, planItem) => {
    const { planItemId, noAplicaEmployeeIds } = planItem;

    if (noAplicaEmployeeIds && noAplicaEmployeeIds.includes(empleadoId)) {
      return { estado: CELL_STATE.NOT_APPLICABLE, sessionId: null };
    }

    const session = sessionByPlanItem[planItemId];
    if (!session) return { estado: CELL_STATE.NOT_TRAINED, sessionId: null };

    const attendance = attendanceMap[session.id]?.[empleadoId];
    const estado = (() => {
      if (session.status === TRAINING_SESSION_STATUSES.CLOSED) {
        return attendance?.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT
          ? CELL_STATE.COMPLETE
          : CELL_STATE.NOT_TRAINED;
      }

      if (IN_PROGRESS_STATUSES.has(session.status)) {
        const isInvitedOrPresent =
          attendance?.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.INVITED ||
          attendance?.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT;
        if (isInvitedOrPresent) return CELL_STATE.IN_PROGRESS;
      }

      return CELL_STATE.NOT_TRAINED;
    })();

    return { estado, sessionId: session.id };
  }, [sessionByPlanItem, attendanceMap]);

  // Rows: one per employee, with cellMap per planItem
  const rows = useMemo(() => {
    const allPlanItems = Object.values(columnsByMonth).flat();
    return empleados.map(emp => {
      const cellMap = {};
      allPlanItems.forEach(planItem => {
        cellMap[planItem.planItemId] = computeCellState(emp.id, planItem);
      });

      // % completo: count COMPLETE / (total - NOT_APPLICABLE)
      const relevant = allPlanItems.filter(pi =>
        cellMap[pi.planItemId].estado !== CELL_STATE.NOT_APPLICABLE
      );
      const completed = relevant.filter(pi =>
        cellMap[pi.planItemId].estado === CELL_STATE.COMPLETE
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
  }, [empleados, columnsByMonth, computeCellState]);

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

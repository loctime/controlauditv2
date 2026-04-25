import { useState, useEffect } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { dbAudit } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { useAuth } from '@/components/context/AuthContext';

export function useOnboardingStatus() {
  const {
    isLogged,
    userProfile,
    userEmpresas,
    userSucursales,
    userFormularios,
    loadingEmpresas,
    loadingSucursales,
    loadingFormularios,
  } = useAuth();

  const [hasEmpleados, setHasEmpleados] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(true);

  const ownerId = userProfile?.ownerId;

  useEffect(() => {
    if (!isLogged || !ownerId || loadingEmpresas) {
      setLoadingEmpleados(false);
      return;
    }

    let cancelled = false;
    setLoadingEmpleados(true);

    const checkEmpleados = async () => {
      try {
        const ref = collection(dbAudit, ...firestoreRoutesCore.empleados(ownerId));
        const snap = await getDocs(query(ref, limit(1)));
        if (!cancelled) setHasEmpleados(!snap.empty);
      } catch {
        if (!cancelled) setHasEmpleados(false);
      } finally {
        if (!cancelled) setLoadingEmpleados(false);
      }
    };

    checkEmpleados();
    return () => { cancelled = true; };
  }, [isLogged, ownerId, loadingEmpresas]);

  const loading = loadingEmpresas || loadingSucursales || loadingFormularios || loadingEmpleados;

  const steps = [
    {
      id: 'empresa',
      label: 'Crear empresa',
      done: (userEmpresas?.length ?? 0) > 0,
      route: '/establecimiento',
    },
    {
      id: 'sucursal',
      label: 'Crear sucursal',
      done: (userSucursales?.length ?? 0) > 0,
      route: '/establecimiento',
    },
    {
      id: 'empleado',
      label: 'Agregar empleado',
      done: hasEmpleados,
      route: '/empleados',
    },
    {
      id: 'formulario',
      label: 'Crear formulario',
      done: (userFormularios?.length ?? 0) > 0,
      route: '/editar-formulario',
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;
  const isNewUser = !loading && isLogged && !allDone && (userEmpresas?.length ?? 0) === 0;

  return { loading, steps, completedCount, allDone, isNewUser, isLogged };
}

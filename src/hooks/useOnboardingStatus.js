import { useAuth } from '@/components/context/AuthContext';

export function useOnboardingStatus() {
  const {
    isLogged,
    userEmpresas,
    userSucursales,
    loadingEmpresas,
    loadingSucursales,
  } = useAuth();

  const loading = loadingEmpresas || loadingSucursales;

  const steps = [
    {
      id: 'empresa',
      label: 'Crear empresa',
      done: (userEmpresas?.length ?? 0) > 0,
    },
    {
      id: 'sucursal',
      label: 'Crear sucursal',
      done: (userSucursales?.length ?? 0) > 0,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;
  const isNewUser = !loading && isLogged && (userEmpresas?.length ?? 0) === 0;

  return { loading, steps, completedCount, allDone, isNewUser, isLogged };
}

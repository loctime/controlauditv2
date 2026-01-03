/**
 * Configuración del QueryClient de TanStack Query
 * 
 * Este archivo se usará para configurar el QueryClientProvider en main.jsx
 * después de instalar @tanstack/react-query
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración del QueryClient con opciones por defecto
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos" antes de refetch automático
      staleTime: 30000, // 30 segundos
      
      // Tiempo que los datos se mantienen en cache después de no usarse
      gcTime: 5 * 60 * 1000, // 5 minutos (antes se llamaba cacheTime)
      
      // Reintentos en caso de error
      retry: 1,
      
      // Delay entre reintentos
      retryDelay: 1000,
      
      // Refetch automático cuando la ventana recupera foco
      refetchOnWindowFocus: false,
      
      // Refetch automático cuando se reconecta
      refetchOnReconnect: true,
      
      // NO refetch automático al montar (evita parpadeos)
      refetchOnMount: false,
    },
  },
});

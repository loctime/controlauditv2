import { useState, useEffect, useCallback } from 'react';
import { getCompleteUserCache, saveCompleteUserCache } from '../services/completeOfflineCache';
import { useAuth } from '@/components/context/AuthContext';
import { getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { shouldEnableOffline } from '../utils/pwaDetection';

/**
 * Hook para cargar datos de la aplicación, priorizando el cache offline
 * y actualizando desde la red cuando sea necesario.
 * 
 * ⚠️ MIGRACIÓN PENDIENTE: Este hook usa colecciones que requieren referencias por parámetro:
 * - empresas (necesita referencia de colección)
 * - apps/audit/users (necesita referencia de colección)
 * - formularios (necesita referencia de colección)
 * - auditorias (necesita referencia de colección)
 * 
 * Para migrar completamente, el hook debería recibir estas referencias como parámetros.
 */
export const useOfflineData = (empresasCollectionRef, usuariosCollectionRef, formulariosCollectionRef, auditoriasCollectionRef) => {
  const { user, userProfile: authUserProfile, isOnline } = useAuth();
  const [profile, setProfile] = useState(authUserProfile);
  const [empresas, setEmpresas] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      setProfile(null);
      setEmpresas([]);
      setFormularios([]);
      setAuditorias([]);
      setLoading(false);
      setCacheLoaded(false);
      return;
    }

    setLoading(true);
    setError(null);
    let cachedData = null;

    // 1. Intentar cargar desde cache offline
    try {
      console.log('🔍 Intentando cargar cache offline para usuario:', user.uid);
      cachedData = await getCompleteUserCache(user.uid);
      if (cachedData) {
        setProfile(cachedData.userProfile);
        setEmpresas(cachedData.empresas || []);
        setFormularios(cachedData.formularios || []);
        setAuditorias(cachedData.auditorias || []);
        setCacheLoaded(true);
        console.log('✅ Datos cargados desde cache offline:', {
          empresas: (cachedData.empresas || []).length,
          formularios: (cachedData.formularios || []).length
        });
      } else {
        console.log('⚠️ No hay datos en cache offline para usuario:', user.uid);
      }
    } catch (err) {
      console.warn('⚠️ Error al cargar datos desde cache offline:', err);
    }

    // 2. Si hay conexión, intentar cargar desde la red y actualizar cache
    if (isOnline) {
      console.log('🌐 Cargando datos desde la red...');
      try {
        // Cargar empresas
        if (empresasCollectionRef) {
          let qEmpresas;
          
          if (authUserProfile?.role === 'superdev') {
            qEmpresas = query(empresasCollectionRef);
          } else if (authUserProfile?.role === 'admin') {
            // Cargar empresas propias
            const empresasPropias = query(empresasCollectionRef, where('propietarioId', '==', user.uid));
            const empresasPropiasSnapshot = await getDocs(empresasPropias);
            const misEmpresas = empresasPropiasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Cargar usuarios operarios y sus empresas
            if (usuariosCollectionRef) {
              const usuariosQuery = query(usuariosCollectionRef, where('clienteAdminId', '==', user.uid));
              const usuariosSnapshot = await getDocs(usuariosQuery);
              const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

              // Cargar empresas de operarios
              const empresasOperariosPromises = usuariosOperarios.map(async (operarioId) => {
                const operarioEmpresasQuery = query(empresasCollectionRef, where('propietarioId', '==', operarioId));
                const operarioEmpresasSnapshot = await getDocs(operarioEmpresasQuery);
                return operarioEmpresasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              });

              const empresasOperariosArrays = await Promise.all(empresasOperariosPromises);
              const empresasOperarios = empresasOperariosArrays.flat();
              
              const onlineEmpresas = [...misEmpresas, ...empresasOperarios];
              setEmpresas(onlineEmpresas);
            } else {
              setEmpresas(misEmpresas);
            }
          } else if (authUserProfile?.role === 'operario' && authUserProfile?.clienteAdminId) {
            qEmpresas = query(empresasCollectionRef, where('propietarioId', '==', authUserProfile.clienteAdminId));
          } else {
            qEmpresas = query(empresasCollectionRef, where('usuarios', 'array-contains', user.uid));
          }

          if (qEmpresas) {
            const empresasSnapshot = await getDocs(qEmpresas);
            const onlineEmpresas = empresasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmpresas(onlineEmpresas);
          }
        }

        // Cargar formularios
        if (formulariosCollectionRef) {
          let qFormularios;
          
          if (authUserProfile?.role === 'admin' || authUserProfile?.role === 'superAdmin') {
            qFormularios = query(formulariosCollectionRef, where('clienteAdminId', '==', user.uid));
          } else {
            // Para operarios, cargar formularios públicos o del cliente admin
            if (authUserProfile?.clienteAdminId) {
              qFormularios = query(formulariosCollectionRef, where('clienteAdminId', '==', authUserProfile.clienteAdminId));
            } else {
              qFormularios = query(formulariosCollectionRef, where('esPublico', '==', true));
            }
          }
          
          if (qFormularios) {
            const formulariosSnapshot = await getDocs(qFormularios);
            const onlineFormularios = formulariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFormularios(onlineFormularios);
          }
        }

        // Cargar auditorías recientes
        if (auditoriasCollectionRef) {
          const qAuditorias = query(
            auditoriasCollectionRef, 
            where('userId', '==', user.uid), 
            orderBy('createdAt', 'desc'), 
            limit(20)
          );
          const auditoriasSnapshot = await getDocs(qAuditorias);
          const onlineAuditorias = auditoriasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAuditorias(onlineAuditorias);
        }

        setCacheLoaded(true);

        // Guardar en cache offline para futuras cargas (solo en móvil)
        if (shouldEnableOffline() && authUserProfile) {
          await saveCompleteUserCache({
            ...authUserProfile,
            empresas: empresas, // Usar el estado actual de empresas
            formularios: formularios, // Usar el estado actual de formularios
            auditorias: auditorias // Usar el estado actual de auditorias
          });
          console.log('✅ Datos cargados desde la red y guardados en cache offline.');
        } else if (!shouldEnableOffline()) {
          console.log('💻 Desktop: Datos cargados (cache offline no necesario)');
        }

      } catch (err) {
        console.error('❌ Error al cargar datos desde la red:', err);
        setError('Error al cargar datos desde la red. Intenta nuevamente.');
        // Si falla la carga online y no hay cache, limpiar estados
        if (!cachedData) {
          setProfile(null);
          setEmpresas([]);
          setFormularios([]);
          setAuditorias([]);
        }
      }
    } else if (!cachedData) {
      setError('No hay conexión a internet y no se encontraron datos en cache offline.');
    }

    setLoading(false);
  }, [user?.uid, isOnline, authUserProfile, empresasCollectionRef, usuariosCollectionRef, formulariosCollectionRef, auditoriasCollectionRef]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    profile, 
    empresas, 
    formularios, 
    auditorias, 
    loading, 
    error, 
    cacheLoaded, 
    refetchData: fetchData 
  };
};

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

/**
 * Hook para cargar formularios con cache y filtrado multi-tenant
 */
export const useFormulariosData = (user, userProfile) => {
  const [formularios, setFormularios] = useState([]);
  const [formulariosCompletos, setFormulariosCompletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(false);

  const CACHE_KEY = 'formularios_detalle_cache';
  const CACHE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutos

  // Cargar detalles completos con cache
  const cargarDetallesFormularios = useCallback(async (formulariosPermitidos) => {
    try {
      const cacheRaw = localStorage.getItem(CACHE_KEY);
      if (cacheRaw) {
        const cache = JSON.parse(cacheRaw);
        if (Date.now() - cache.timestamp < CACHE_EXPIRATION_MS) {
          const idsCache = cache.formularios.map(f => f.id).sort().join(',');
          const idsActual = formulariosPermitidos.map(f => f.id).sort().join(',');
          if (idsCache === idsActual) {
            setFormulariosCompletos(cache.formularios);
            console.debug('[useFormulariosData] Formularios cargados de cache');
            setLoading(false);
            return;
          }
        }
      }
    } catch (e) { 
      console.warn('Error leyendo cache:', e); 
    }

    setLoading(true);
    const detalles = await Promise.all(formulariosPermitidos.map(async (meta) => {
      try {
        const docSnap = await getDoc(doc(db, 'formularios', meta.id));
        const data = docSnap.data();
        return { ...meta, ...data, id: meta.id };
      } catch (e) {
        console.warn('Error cargando detalle', meta.id, e);
        return meta;
      }
    }));
    
    setFormulariosCompletos(detalles);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ 
        formularios: detalles, 
        timestamp: Date.now() 
      }));
    } catch (e) { 
      console.warn('Error guardando cache:', e); 
    }
    
    setLoading(false);
    console.debug('[useFormulariosData] Formularios cargados de Firestore');
  }, []);

  // Filtrar formularios por permisos multi-tenant
  const filtrarPorPermisos = useCallback((metadatos) => {
    // Obtener UID antiguo si existe (para migración)
    const oldUid = userProfile?.migratedFromUid;
    
    return metadatos.filter(formulario => {
      if (userProfile?.role === 'supermax') return true;
      if (userProfile?.role === 'max') {
        // Verificar con UID nuevo
        if (formulario.clienteAdminId === user.uid) return true;
        if (formulario.creadorId === user.uid) return true;
        // Verificar con UID antiguo (migración)
        if (oldUid && formulario.clienteAdminId === oldUid) return true;
        if (oldUid && formulario.creadorId === oldUid) return true;
        // Verificar en arrays de permisos
        if (oldUid && formulario.permisos?.puedeEditar?.includes(oldUid)) return true;
        if (oldUid && formulario.permisos?.puedeVer?.includes(oldUid)) return true;
        return false;
      }
      if (userProfile?.role === 'operario') {
        // Verificar con UID nuevo
        if (formulario.creadorId === user.uid) return true;
        if (formulario.clienteAdminId === userProfile.clienteAdminId) return true;
        if (formulario.esPublico) return true;
        if (formulario.permisos?.puedeVer?.includes(user.uid)) return true;
        // Verificar con UID antiguo (migración)
        if (oldUid && formulario.creadorId === oldUid) return true;
        if (oldUid && formulario.clienteAdminId === userProfile.migratedFromUid) return true;
        if (oldUid && formulario.permisos?.puedeVer?.includes(oldUid)) return true;
        return false;
      }
      return false;
    });
  }, [user, userProfile]);

  // Suscripción reactiva
  useEffect(() => {
    if (!user) {
      setFormularios([]);
      setFormulariosCompletos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const formulariosCollection = collection(db, "formularios");
    const unsubscribe = onSnapshot(formulariosCollection, (res) => {
      const metadatos = res.docs.map((formulario) => {
        const data = formulario.data();
        return {
          id: formulario.id,
          nombre: data.nombre,
          creadorId: data.creadorId,
          creadorNombre: data.creadorNombre,
          creadorEmail: data.creadorEmail,
          clienteAdminId: data.clienteAdminId,
          estado: data.estado,
          version: data.version,
          esPublico: data.esPublico,
          timestamp: data.timestamp,
          ultimaModificacion: data.ultimaModificacion,
          permisos: data.permisos
        };
      });

      const formulariosPermitidos = filtrarPorPermisos(metadatos);
      setFormularios(formulariosPermitidos);
      cargarDetallesFormularios(formulariosPermitidos);
    }, (error) => {
      setLoading(false);
      console.error('[onSnapshot] Error:', error);
    });

    return () => unsubscribe();
  }, [user, userProfile, reload, cargarDetallesFormularios, filtrarPorPermisos]);

  const recargar = useCallback(() => {
    setReload(prev => !prev);
  }, []);

  return { 
    formularios, 
    formulariosCompletos, 
    loading, 
    recargar
  };
};


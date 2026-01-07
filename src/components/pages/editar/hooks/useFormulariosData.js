import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { dbAudit } from '../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../core/firestore/firestoreRoutes.core';

/**
 * Hook para cargar formularios con cache (owner-centric)
 * Los datos ya vienen filtrados desde apps/auditoria/owners/{ownerId}/formularios
 */
export const useFormulariosData = (user, userProfile) => {
  const [formularios, setFormularios] = useState([]);
  const [formulariosCompletos, setFormulariosCompletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(false);

  const CACHE_KEY = 'formularios_detalle_cache';
  const CACHE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutos

  // Cargar detalles completos con cache
  const cargarDetallesFormularios = useCallback(async (metadatos) => {
    try {
      const cacheRaw = localStorage.getItem(CACHE_KEY);
      if (cacheRaw) {
        const cache = JSON.parse(cacheRaw);
        if (Date.now() - cache.timestamp < CACHE_EXPIRATION_MS) {
          const idsCache = cache.formularios.map(f => f.id).sort().join(',');
          const idsActual = metadatos.map(f => f.id).sort().join(',');
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
    // Los datos ya vienen completos desde la colección owner-centric
    setFormulariosCompletos(metadatos);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ 
        formularios: metadatos, 
        timestamp: Date.now() 
      }));
    } catch (e) { 
      console.warn('Error guardando cache:', e); 
    }
    
    setLoading(false);
    console.debug('[useFormulariosData] Formularios cargados de Firestore');
  }, []);

  // Suscripción reactiva
  useEffect(() => {
    if (!user || !userProfile?.ownerId) {
      setFormularios([]);
      setFormulariosCompletos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Usar estructura owner-centric: apps/auditoria/owners/{ownerId}/formularios
    // Los datos ya vienen filtrados por owner
    const ownerId = userProfile.ownerId;
    const formulariosCollection = collection(dbAudit, ...firestoreRoutesCore.formularios(ownerId));
    const unsubscribe = onSnapshot(formulariosCollection, (res) => {
      const metadatos = res.docs.map((formulario) => {
        const data = formulario.data();
        return {
          id: formulario.id,
          ...data
        };
      });

      // Usar directamente los datos sin filtros de identidad
      setFormularios(metadatos);
      cargarDetallesFormularios(metadatos);
    }, (error) => {
      setLoading(false);
      console.error('[onSnapshot] Error:', error);
    });

    return () => unsubscribe();
  }, [user, userProfile, reload, cargarDetallesFormularios]);

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


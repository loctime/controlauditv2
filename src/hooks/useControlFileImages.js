// src/hooks/useControlFileImages.js

import React from 'react';
import { convertirShareTokenAUrl } from '../utils/imageUtils';

/**
 * Hook reutilizable para manejar imágenes de ControlFile
 * 
 * Convierte shareTokens a blob URLs para evitar errores de CORS
 * y proporciona funcionalidad de modal y descarga.
 * 
 * @param {Array} registros - Array de registros con imágenes (cada registro tiene propiedad `imagenes`)
 * @returns {Object} Objeto con estados y funciones para manejar imágenes
 */
const useControlFileImages = (registros = []) => {
  // Map de imgId -> blobUrl para thumbnails
  const [evidenciasBlobUrls, setEvidenciasBlobUrls] = React.useState(new Map());
  // Map de imgId -> blob para descarga
  const [evidenciasBlobs, setEvidenciasBlobs] = React.useState(new Map());
  // Map de imgId -> loading state
  const [evidenciasLoading, setEvidenciasLoading] = React.useState(new Map());
  // Map de imgId -> error state (guarda URL original para fallback)
  const [evidenciasErrors, setEvidenciasErrors] = React.useState(new Map());
  // Map de imgId -> metadata (nombre, tamaño, etc)
  const [evidenciasMetadata, setEvidenciasMetadata] = React.useState(new Map());
  
  // Estado del modal
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedEvidencia, setSelectedEvidencia] = React.useState(null);
  
  // Refs para rastrear estado interno (evita loops y permite cleanup)
  const loadingRef = React.useRef(new Set());
  const blobUrlsRef = React.useRef(new Map());
  const loadedRef = React.useRef(new Set());

  // Cargar imágenes como blobs cuando cambian los registros
  React.useEffect(() => {
    if (registros.length === 0) return;

    // Acumular cambios en Maps locales para hacer UN setState por tipo
    const newLoading = new Map();
    const newErrors = new Map();

    // Identificar todas las evidencias que necesitan ser cargadas
    registros.forEach(registro => {
      if (registro.imagenes && Array.isArray(registro.imagenes)) {
        registro.imagenes.forEach((img, idx) => {
          const imgId = img.id || `${registro.id}-${idx}`;
          const shareToken = img.shareToken || img.url || img;
          const url = convertirShareTokenAUrl(shareToken);
          
          // Solo cargar si hay URL válida y no está ya cargada o en proceso
          if (url && !loadedRef.current.has(imgId) && !loadingRef.current.has(imgId)) {
            // Marcar como cargando en el ref
            loadingRef.current.add(imgId);
            newLoading.set(imgId, true);
            
            // Hacer fetch y convertir a blob
            fetch(url, { mode: 'cors', credentials: 'omit' })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}`);
                }
                return response.blob();
              })
              .then(blob => {
                // Crear blob URL para mostrar
                const blobUrl = URL.createObjectURL(blob);
                
                // Guardar en ref para limpieza
                blobUrlsRef.current.set(imgId, blobUrl);
                
                // Marcar como cargada
                loadedRef.current.add(imgId);
                
                // Guardar metadata
                const metadata = {
                  nombre: img.nombre || `evidencia-${imgId}`,
                  tamaño: blob.size,
                  tipo: blob.type || 'image/jpeg'
                };
                
                // Actualizar estados con UN setState por tipo
                setEvidenciasBlobUrls(prev => {
                  const newMap = new Map(prev);
                  newMap.set(imgId, blobUrl);
                  return newMap;
                });
                setEvidenciasBlobs(prev => {
                  const newMap = new Map(prev);
                  newMap.set(imgId, blob);
                  return newMap;
                });
                setEvidenciasMetadata(prev => {
                  const newMap = new Map(prev);
                  newMap.set(imgId, metadata);
                  return newMap;
                });
                setEvidenciasLoading(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(imgId);
                  return newMap;
                });
                
                // Remover del ref de carga
                loadingRef.current.delete(imgId);
              })
              .catch(error => {
                console.error(`[useControlFileImages] Error cargando imagen ${imgId}:`, error);
                
                // Actualizar estados
                setEvidenciasErrors(prev => {
                  const newMap = new Map(prev);
                  newMap.set(imgId, url);
                  return newMap;
                });
                setEvidenciasLoading(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(imgId);
                  return newMap;
                });
                
                // Remover del ref de carga
                loadingRef.current.delete(imgId);
              });
          } else if (!url) {
            // No hay URL válida, marcar como error
            newErrors.set(imgId, null);
          }
        });
      }
    });

    // Actualizar estados acumulados (UN setState por tipo) solo si hay cambios
    if (newLoading.size > 0) {
      setEvidenciasLoading(prev => {
        const newMap = new Map(prev);
        newLoading.forEach((value, key) => newMap.set(key, value));
        return newMap;
      });
    }
    if (newErrors.size > 0) {
      setEvidenciasErrors(prev => {
        const newMap = new Map(prev);
        newErrors.forEach((value, key) => newMap.set(key, value));
        return newMap;
      });
    }
  }, [registros]);

  // Limpiar blob URLs de imágenes que ya no están en los registros
  React.useEffect(() => {
    // Obtener todos los imgIds actuales de los registros
    const currentImgIds = new Set();
    registros.forEach(registro => {
      if (registro.imagenes && Array.isArray(registro.imagenes)) {
        registro.imagenes.forEach((img, idx) => {
          const imgId = img.id || `${registro.id}-${idx}`;
          currentImgIds.add(imgId);
        });
      }
    });

    // Revocar blob URLs de imágenes que ya no están presentes
    const toRemove = [];
    blobUrlsRef.current.forEach((blobUrl, imgId) => {
      if (!currentImgIds.has(imgId)) {
        if (blobUrl && blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl);
        }
        blobUrlsRef.current.delete(imgId);
        loadedRef.current.delete(imgId);
        toRemove.push(imgId);
      }
    });

    // Limpiar estados de imágenes removidas (UN setState por tipo)
    if (toRemove.length > 0) {
      setEvidenciasBlobUrls(prev => {
        const newMap = new Map(prev);
        toRemove.forEach(imgId => newMap.delete(imgId));
        return newMap;
      });
      setEvidenciasBlobs(prev => {
        const newMap = new Map(prev);
        toRemove.forEach(imgId => newMap.delete(imgId));
        return newMap;
      });
      setEvidenciasLoading(prev => {
        const newMap = new Map(prev);
        toRemove.forEach(imgId => newMap.delete(imgId));
        return newMap;
      });
      setEvidenciasErrors(prev => {
        const newMap = new Map(prev);
        toRemove.forEach(imgId => newMap.delete(imgId));
        return newMap;
      });
      setEvidenciasMetadata(prev => {
        const newMap = new Map(prev);
        toRemove.forEach(imgId => newMap.delete(imgId));
        return newMap;
      });
    }
  }, [registros]);

  // Limpiar todos los blob URLs al desmontar
  React.useEffect(() => {
    return () => {
      // Revocar todos los blob URLs del ref
      blobUrlsRef.current.forEach((blobUrl) => {
        if (blobUrl && blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl);
        }
      });
      blobUrlsRef.current.clear();
      loadingRef.current.clear();
      loadedRef.current.clear();
      
      // Limpiar estados para evitar estados "zombies"
      setEvidenciasBlobUrls(new Map());
      setEvidenciasBlobs(new Map());
      setEvidenciasErrors(new Map());
      setEvidenciasLoading(new Map());
      setEvidenciasMetadata(new Map());
    };
  }, []);

  // Función para abrir imagen en modal
  const openImage = React.useCallback((imgId, evidencia) => {
    const blobUrl = evidenciasBlobUrls.get(imgId);
    const blob = evidenciasBlobs.get(imgId);
    const metadata = evidenciasMetadata.get(imgId);
    const errorUrl = evidenciasErrors.get(imgId);
    
    // Si tenemos blob URL, abrir modal
    if (blobUrl && blob) {
      setSelectedEvidencia({
        imageUrl: blobUrl,
        imageBlob: blob,
        imageName: metadata?.nombre || evidencia?.nombre || `evidencia-${imgId}`,
        imageSize: metadata?.tamaño,
        imageType: metadata?.tipo
      });
      setModalOpen(true);
    } else if (errorUrl) {
      // Fallback: abrir en nueva pestaña
      window.open(errorUrl, '_blank');
    } else {
      // Intentar obtener URL desde shareToken como último recurso
      const url = convertirShareTokenAUrl(evidencia?.shareToken || evidencia?.url || evidencia);
      if (url) {
        window.open(url, '_blank');
      }
    }
  }, [evidenciasBlobUrls, evidenciasBlobs, evidenciasMetadata, evidenciasErrors]);

  // Función para cerrar modal
  const closeImage = React.useCallback(() => {
    setModalOpen(false);
    setSelectedEvidencia(null);
  }, []);

  return {
    // Estados
    blobUrls: evidenciasBlobUrls,
    blobs: evidenciasBlobs,
    loading: evidenciasLoading,
    errors: evidenciasErrors,
    metadata: evidenciasMetadata,
    
    // Modal
    modalOpen,
    selectedEvidencia,
    openImage,
    closeImage
  };
};

export default useControlFileImages;

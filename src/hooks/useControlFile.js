import { useState, useEffect, useCallback } from 'react';
import ControlFileClient from '../lib/controlfile-client.js';

export const useControlFile = () => {
  const [controlFileClient] = useState(() => new ControlFileClient());
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar disponibilidad al montar el hook
  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const available = await controlFileClient.isAvailable();
      setIsAvailable(available);
      console.log('🔍 ControlFile disponible:', available);
    } catch (err) {
      console.warn('⚠️ Error verificando ControlFile:', err.message);
      setError(err.message);
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, [controlFileClient]);

  // Función para subir archivo
  const uploadFile = useCallback(async (file, options = {}) => {
    if (!isAvailable) {
      throw new Error('ControlFile no está disponible');
    }

    try {
      setError(null);
      
      // 1. Crear sesión de subida
      const presignData = await controlFileClient.presignUpload({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        parentId: options.parentId || null,
        ...options
      });

      // 2. Subir archivo al bucket
      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Error subiendo archivo al bucket');
      }

      // 3. Confirmar subida
      const confirmData = await controlFileClient.confirmUpload({
        uploadId: presignData.uploadId,
        etag: presignData.etag,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        parentId: options.parentId || null
      });

      return {
        success: true,
        fileId: confirmData.fileId,
        downloadUrl: confirmData.downloadUrl,
        bucketKey: confirmData.bucketKey,
        etag: confirmData.etag,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAvailable, controlFileClient]);

  // Función para listar archivos
  const listFiles = useCallback(async (options = {}) => {
    if (!isAvailable) {
      throw new Error('ControlFile no está disponible');
    }

    try {
      setError(null);
      return await controlFileClient.listFiles(options);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAvailable, controlFileClient]);

  // Función para obtener URL de descarga
  const getDownloadUrl = useCallback(async (fileId) => {
    if (!isAvailable) {
      throw new Error('ControlFile no está disponible');
    }

    try {
      setError(null);
      return await controlFileClient.getDownloadUrl(fileId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAvailable, controlFileClient]);

  // Función para eliminar archivo
  const deleteFile = useCallback(async (fileId) => {
    if (!isAvailable) {
      throw new Error('ControlFile no está disponible');
    }

    try {
      setError(null);
      return await controlFileClient.deleteFile(fileId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAvailable, controlFileClient]);

  // Función para renombrar archivo
  const renameFile = useCallback(async (fileId, newName) => {
    if (!isAvailable) {
      throw new Error('ControlFile no está disponible');
    }

    try {
      setError(null);
      return await controlFileClient.renameFile(fileId, newName);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAvailable, controlFileClient]);

  // Función para refrescar disponibilidad
  const refreshAvailability = useCallback(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    // Estado
    isAvailable,
    isLoading,
    error,
    
    // Funciones
    uploadFile,
    listFiles,
    getDownloadUrl,
    deleteFile,
    renameFile,
    refreshAvailability,
    
    // Cliente directo (para casos especiales)
    client: controlFileClient
  };
};

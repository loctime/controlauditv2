import logger from '@/utils/logger';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { getDownloadUrl } from '../../../../services/controlFileB2Service';
import { uploadFileWithContext } from '../../../../services/unifiedFileUploadService';
import { createEmpresa } from '../../../../core/services/ownerEmpresaService';
import { v4 as uuidv4 } from 'uuid';
/**
 * Hook para handlers de empresas
 * 
 * Usa ownerEmpresaService.createEmpresa para crear empresas siguiendo el modelo owner-centric
 */
export const useEmpresasHandlers = (ownerId, updateEmpresa, onEmpresaCreated) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    logo: null
  });

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEmpresa((prevEmpresa) => ({
      ...prevEmpresa,
      [name]: value
    }));
  }, []);

  const handleLogoChange = useCallback((e) => {
    setEmpresa((prevEmpresa) => ({
      ...prevEmpresa,
      logo: e.target.files[0]
    }));
  }, []);

  const handleAddEmpresa = useCallback(async () => {
    logger.debug('[useEmpresasHandlers][handleAddEmpresa] ===== INICIO =====');
    logger.debug('[useEmpresasHandlers][handleAddEmpresa] Estado inicial:', {
      nombre: empresa.nombre,
      ownerId,
      tieneLogo: !!empresa.logo
    });

    if (!empresa.nombre.trim()) {
      logger.warn('[useEmpresasHandlers][handleAddEmpresa] ⚠️ Validación fallida: nombre vacío');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la empresa es requerido'
      });
      return;
    }

    if (!ownerId) {
      logger.error('[useEmpresasHandlers][handleAddEmpresa] ❌ ERROR: ownerId no disponible');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo identificar el propietario'
      });
      return;
    }

    logger.debug('[useEmpresasHandlers][handleAddEmpresa] ✅ Validaciones pasadas, iniciando creación');
    setLoading(true);
    try {
      // Generar ID único para la empresa (se usa también en el flujo de upload unificado)
      const empresaId = uuidv4();

      let logoShareToken = null;
      if (empresa.logo) {
        try {
          const result = await uploadFileWithContext({
            file: empresa.logo,
            context: {
              contextType: 'empresa',
              contextEventId: empresa.nombre,
              companyId: empresa.nombre,
              tipoArchivo: 'logo'
            },
            fecha: new Date()
          });
          
          // Guardar shareToken (no URL temporal)
          logoShareToken = result.shareToken || null;
          
          logger.debug('[useEmpresasHandlers] ✅ Logo subido a ControlFile, shareToken:', logoShareToken);
        } catch (error) {
          logger.error('[useEmpresasHandlers] Error al subir logo:', error);
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'Error al subir el logo, pero la empresa se creará sin logo'
          });
          // Continuar con logoShareToken = null
        }
      }

      logger.debug('[useEmpresasHandlers][handleAddEmpresa] Evento: Crear empresa');
      logger.debug('[useEmpresasHandlers][handleAddEmpresa] Parámetros:', {
        ownerId,
        empresaId,
        nombre: empresa.nombre,
        activa: true,
        logoShareToken
      });

      // Crear empresa usando ownerEmpresaService (modelo owner-centric)
      try {
        await createEmpresa(ownerId, {
          id: empresaId,
          nombre: empresa.nombre,
          activa: true,
          logoShareToken: logoShareToken
        });
        logger.debug('[useEmpresasHandlers][handleAddEmpresa] ✅ Success - Empresa creada');
      } catch (error) {
        console.group('[Firestore ERROR]');
        logger.error('code:', error.code);
        logger.error('message:', error.message);
        logger.error('stack:', error.stack);
        console.groupEnd();
        
        logger.error('[useEmpresasHandlers][handleAddEmpresa] ❌ ERROR al llamar createEmpresa');
        logger.error('[useEmpresasHandlers][handleAddEmpresa] Parámetros:', {
          ownerId,
          empresaId,
          nombre: empresa.nombre
        });
        logger.error('[useEmpresasHandlers][handleAddEmpresa] Error:', error);
        throw error; // Re-lanzar para que el catch externo lo maneje
      }

      // TODO: Guardar datos adicionales (direccion, telefono, logo) en un documento extendido
      // Por ahora, estos campos se mantienen en el sistema legacy si es necesario
      // La empresa core solo tiene: id, nombre, activa

      setEmpresa({
        nombre: "",
        direccion: "",
        telefono: "",
        logo: null
      });

      logger.debug('[useEmpresasHandlers][handleAddEmpresa] ✅ ===== ÉXITO COMPLETO =====');
      
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Empresa creada exitosamente'
      });
      
      // Invalidar y refrescar la query de empresas para actualizar la lista
      // Esperar un momento para que Firestore propague los cambios
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // Invalidar la query de empresas para forzar refetch
        await queryClient.invalidateQueries({ 
          queryKey: ['empresas', ownerId] 
        });
        
        logger.debug('[useEmpresasHandlers] ✅ Query de empresas invalidada, lista se actualizará automáticamente');
      } catch (queryError) {
        logger.warn('[useEmpresasHandlers] ⚠️ No se pudo invalidar query de empresas:', queryError);
        // No es crítico, el listener reactivo debería actualizar eventualmente
      }
      
      if (onEmpresaCreated) {
        onEmpresaCreated();
      }
    } catch (error) {
      console.group('[Firestore ERROR]');
      logger.error('code:', error.code);
      logger.error('message:', error.message);
      logger.error('stack:', error.stack);
      console.groupEnd();
      
      logger.error('[useEmpresasHandlers][handleAddEmpresa] ===== ERROR CAPTURADO =====');
      logger.error('[useEmpresasHandlers][handleAddEmpresa] Error completo:', error);
      logger.error('[useEmpresasHandlers][handleAddEmpresa] error.code:', error.code);
      logger.error('[useEmpresasHandlers][handleAddEmpresa] error.message:', error.message);
      logger.error('[useEmpresasHandlers][handleAddEmpresa] error.stack:', error.stack);
      logger.error('[useEmpresasHandlers][handleAddEmpresa] Parámetros al momento del error:', {
        ownerId,
        empresaNombre: empresa.nombre,
        tieneLogo: !!empresa.logo
      });
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al crear la empresa'
      });
    } finally {
      logger.debug('[useEmpresasHandlers][handleAddEmpresa] ===== FINALIZANDO =====');
      setLoading(false);
    }
  }, [empresa, ownerId, onEmpresaCreated, queryClient]);

  const resetEmpresa = useCallback(() => {
    setEmpresa({
      nombre: "",
      direccion: "",
      telefono: "",
      logo: null
    });
  }, []);

  return {
    empresa,
    loading,
    handleInputChange,
    handleLogoChange,
    handleAddEmpresa,
    resetEmpresa,
    setLoading
  };
};

/**
 * Hook para handlers de edición de empresas
 */
export const useEmpresasEditHandlers = (updateEmpresa, ownerId) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [empresaEdit, setEmpresaEdit] = useState(null);

  const handleEditInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEmpresaEdit((prevEmpresa) => ({
      ...prevEmpresa,
      [name]: value
    }));
  }, []);

  const handleEditLogoChange = useCallback((e) => {
    setEmpresaEdit((prevEmpresa) => ({
      ...prevEmpresa,
      logo: e.target.files[0]
    }));
  }, []);

  const handleEditEmpresa = useCallback(async () => {
    if (!empresaEdit.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la empresa es requerido'
      });
      return;
    }

    setLoading(true);
    try {
      let logoURL = empresaEdit.logoURL || "";
      if (empresaEdit.logo && empresaEdit.logo instanceof File) {
        try {
          const result = await uploadFileWithContext({
            file: empresaEdit.logo,
            context: {
              contextType: 'empresa',
              contextEventId: empresaEdit.nombre,
              companyId: empresaEdit.nombre,
              tipoArchivo: 'logo'
            },
            fecha: new Date()
          });

          // Obtener URL temporal para guardar (se regenerará cuando se necesite)
          logoURL = await getDownloadUrl(result.fileId);
          
          logger.debug('[useEmpresasHandlers] ✅ Logo actualizado en ControlFile');
        } catch (error) {
          logger.error('[useEmpresasHandlers] Error al subir logo:', error);
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'Error al subir el logo, pero la empresa se actualizará con el logo anterior'
          });
        }
      }

      await updateEmpresa(empresaEdit.id, {
        nombre: empresaEdit.nombre,
        direccion: empresaEdit.direccion,
        telefono: empresaEdit.telefono,
        logo: logoURL
      });

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Empresa actualizada exitosamente'
      });
      
      // Invalidar y refrescar la query de empresas para actualizar la lista
      if (ownerId) {
        // Esperar un momento para que Firestore propague los cambios
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          // Invalidar la query de empresas para forzar refetch
          await queryClient.invalidateQueries({ 
            queryKey: ['empresas', ownerId] 
          });
          
          logger.debug('[useEmpresasEditHandlers] ✅ Query de empresas invalidada después de editar');
        } catch (queryError) {
          logger.warn('[useEmpresasEditHandlers] ⚠️ No se pudo invalidar query de empresas:', queryError);
        }
      }
    } catch (error) {
      logger.error('Error al actualizar empresa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar la empresa'
      });
    } finally {
      setLoading(false);
    }
  }, [empresaEdit, updateEmpresa, ownerId, queryClient]);

  return {
    empresaEdit,
    loading,
    setEmpresaEdit,
    handleEditInputChange,
    handleEditLogoChange,
    handleEditEmpresa,
    setLoading
  };
};





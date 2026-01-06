import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { uploadEvidence, getDownloadUrl, ensureTaskbarFolder, createSubFolder, listFiles } from '../../../../services/controlFileB2Service';
import { createEmpresa } from '../../../../core/services/ownerEmpresaService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Hook para handlers de empresas
 * 
 * Usa ownerEmpresaService.createEmpresa para crear empresas siguiendo el modelo owner-centric
 */
export const useEmpresasHandlers = (ownerId, updateEmpresa, onEmpresaCreated) => {
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
    console.log('[useEmpresasHandlers][handleAddEmpresa] ===== INICIO =====');
    console.log('[useEmpresasHandlers][handleAddEmpresa] Estado inicial:', {
      nombre: empresa.nombre,
      ownerId,
      tieneLogo: !!empresa.logo
    });

    if (!empresa.nombre.trim()) {
      console.warn('[useEmpresasHandlers][handleAddEmpresa] ⚠️ Validación fallida: nombre vacío');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la empresa es requerido'
      });
      return;
    }

    if (!ownerId) {
      console.error('[useEmpresasHandlers][handleAddEmpresa] ❌ ERROR: ownerId no disponible');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo identificar el propietario'
      });
      return;
    }

    console.log('[useEmpresasHandlers][handleAddEmpresa] ✅ Validaciones pasadas, iniciando creación');
    setLoading(true);
    try {
      let logoURL = "";
      if (empresa.logo) {
        try {
          // Obtener o crear carpeta de empresas desde ControlFile
          const mainFolderId = await ensureTaskbarFolder();
          let folderIdEmpresas = null;
          
          if (mainFolderId) {
            // Buscar carpeta de empresas existente o crearla
            const files = await listFiles(mainFolderId);
            const empresasFolder = files.find(f => f.type === 'folder' && f.name === 'Empresas');
            
            if (empresasFolder) {
              folderIdEmpresas = empresasFolder.id;
            } else {
              folderIdEmpresas = await createSubFolder('Empresas', mainFolderId);
            }
          }
          
          // Subir logo a ControlFile
          const result = await uploadEvidence({
            file: empresa.logo,
            auditId: 'empresas',
            companyId: 'system',
            parentId: folderIdEmpresas
          });
          // Obtener URL temporal para guardar (se regenerará cuando se necesite)
          logoURL = await getDownloadUrl(result.fileId);
          
          console.log('[useEmpresasHandlers] ✅ Logo subido a ControlFile');
        } catch (error) {
          console.error('[useEmpresasHandlers] Error al subir logo:', error);
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'Error al subir el logo, pero la empresa se creará sin logo'
          });
        }
      }

      // Generar ID único para la empresa
      const empresaId = uuidv4();

      console.log('[useEmpresasHandlers][handleAddEmpresa] Evento: Crear empresa');
      console.log('[useEmpresasHandlers][handleAddEmpresa] Parámetros:', {
        ownerId,
        empresaId,
        nombre: empresa.nombre,
        activa: true
      });

      // Crear empresa usando ownerEmpresaService (modelo owner-centric)
      try {
        await createEmpresa(ownerId, {
          id: empresaId,
          nombre: empresa.nombre,
          activa: true
        });
        console.log('[useEmpresasHandlers][handleAddEmpresa] ✅ Success - Empresa creada');
      } catch (error) {
        console.group('[Firestore ERROR]');
        console.error('code:', error.code);
        console.error('message:', error.message);
        console.error('stack:', error.stack);
        console.groupEnd();
        
        console.error('[useEmpresasHandlers][handleAddEmpresa] ❌ ERROR al llamar createEmpresa');
        console.error('[useEmpresasHandlers][handleAddEmpresa] Parámetros:', {
          ownerId,
          empresaId,
          nombre: empresa.nombre
        });
        console.error('[useEmpresasHandlers][handleAddEmpresa] Error:', error);
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

      console.log('[useEmpresasHandlers][handleAddEmpresa] ✅ ===== ÉXITO COMPLETO =====');
      
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Empresa creada exitosamente'
      });
      
      if (onEmpresaCreated) {
        onEmpresaCreated();
      }
    } catch (error) {
      console.group('[Firestore ERROR]');
      console.error('code:', error.code);
      console.error('message:', error.message);
      console.error('stack:', error.stack);
      console.groupEnd();
      
      console.error('[useEmpresasHandlers][handleAddEmpresa] ===== ERROR CAPTURADO =====');
      console.error('[useEmpresasHandlers][handleAddEmpresa] Error completo:', error);
      console.error('[useEmpresasHandlers][handleAddEmpresa] error.code:', error.code);
      console.error('[useEmpresasHandlers][handleAddEmpresa] error.message:', error.message);
      console.error('[useEmpresasHandlers][handleAddEmpresa] error.stack:', error.stack);
      console.error('[useEmpresasHandlers][handleAddEmpresa] Parámetros al momento del error:', {
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
      console.log('[useEmpresasHandlers][handleAddEmpresa] ===== FINALIZANDO =====');
      setLoading(false);
    }
  }, [empresa, ownerId, onEmpresaCreated]);

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
export const useEmpresasEditHandlers = (updateEmpresa) => {
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
          // Obtener o crear carpeta de empresas desde ControlFile
          const mainFolderId = await ensureTaskbarFolder();
          let folderIdEmpresas = null;
          
          if (mainFolderId) {
            // Buscar carpeta de empresas existente o crearla
            const files = await listFiles(mainFolderId);
            const empresasFolder = files.find(f => f.type === 'folder' && f.name === 'Empresas');
            
            if (empresasFolder) {
              folderIdEmpresas = empresasFolder.id;
            } else {
              folderIdEmpresas = await createSubFolder('Empresas', mainFolderId);
            }
          }
          
          // Subir logo a ControlFile
          const result = await uploadEvidence({
            file: empresaEdit.logo,
            auditId: 'empresas',
            companyId: 'system',
            parentId: folderIdEmpresas
          });
          // Obtener URL temporal para guardar (se regenerará cuando se necesite)
          logoURL = await getDownloadUrl(result.fileId);
          
          console.log('[useEmpresasHandlers] ✅ Logo actualizado en ControlFile');
        } catch (error) {
          console.error('[useEmpresasHandlers] Error al subir logo:', error);
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
    } catch (error) {
      console.error('Error al actualizar empresa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar la empresa'
      });
    } finally {
      setLoading(false);
    }
  }, [empresaEdit, updateEmpresa]);

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






import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { uploadEvidence, getDownloadUrl, ensureTaskbarFolder, createSubFolder, listFiles } from '../../../../services/controlFileB2Service';

/**
 * Hook para handlers de empresas
 */
export const useEmpresasHandlers = (crearEmpresa, updateEmpresa, onEmpresaCreated) => {
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
    if (!empresa.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la empresa es requerido'
      });
      return;
    }

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

      await crearEmpresa({
        nombre: empresa.nombre,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        logo: logoURL
      });

      setEmpresa({
        nombre: "",
        direccion: "",
        telefono: "",
        logo: null
      });

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Empresa creada exitosamente'
      });
      
      if (onEmpresaCreated) {
        onEmpresaCreated();
      }
    } catch (error) {
      console.error('Error al crear empresa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear la empresa'
      });
    } finally {
      setLoading(false);
    }
  }, [empresa, crearEmpresa, onEmpresaCreated]);

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






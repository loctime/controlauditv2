import { useState, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../../firebaseConfig';
import Swal from 'sweetalert2';

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
        const storageRef = ref(storage, `empresas/${Date.now()}_${empresa.logo.name}`);
        const snapshot = await uploadBytes(storageRef, empresa.logo);
        logoURL = await getDownloadURL(snapshot.ref);
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
        const storageRef = ref(storage, `empresas/${Date.now()}_${empresaEdit.logo.name}`);
        const snapshot = await uploadBytes(storageRef, empresaEdit.logo);
        logoURL = await getDownloadURL(snapshot.ref);
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


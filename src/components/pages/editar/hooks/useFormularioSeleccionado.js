import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebaseAudit';
import Swal from 'sweetalert2';

/**
 * Hook para manejar la selección y carga de formularios
 */
export const useFormularioSeleccionado = (formularios, formulariosCompletos, searchParams, setSearchParams) => {
  const [formularioSeleccionado, setFormularioSeleccionado] = useState(null);
  const [cargandoFormulario, setCargandoFormulario] = useState(false);

  // Mantener formulario actualizado cuando cambian los datos
  useEffect(() => {
    if (formularioSeleccionado?.id && formulariosCompletos.length > 0) {
      const formularioActualizado = formulariosCompletos.find(f => f.id === formularioSeleccionado.id);
      if (formularioActualizado && formularioActualizado.secciones) {
        setFormularioSeleccionado(prev => ({
          ...prev,
          secciones: formularioActualizado.secciones,
          estado: formularioActualizado.estado,
          version: formularioActualizado.version,
          esPublico: formularioActualizado.esPublico,
          ultimaModificacion: formularioActualizado.ultimaModificacion
        }));
      }
    }
  }, [formulariosCompletos]);

  // Auto-seleccionar desde query params
  useEffect(() => {
    const formularioId = searchParams.get('id');
    if (formularioId && formulariosCompletos.length > 0 && !formularioSeleccionado) {
      const detalle = formulariosCompletos.find(f => f.id === formularioId);
      if (detalle) {
        console.log('[useFormularioSeleccionado] Auto-seleccionando desde query:', formularioId);
        setFormularioSeleccionado(detalle);
        setSearchParams({});
      }
    }
  }, [formulariosCompletos, searchParams, formularioSeleccionado, setSearchParams]);

  // Handler para cambio de formulario
  const handleChangeFormulario = useCallback(async (event) => {
    const formularioId = event.target.value;
    
    if (!formularioId) {
      setFormularioSeleccionado(null);
      return;
    }
    
    setCargandoFormulario(true);
    
    let detalle = formulariosCompletos.find(f => f.id === formularioId);
    
    if (!detalle) {
      try {
        const formularioDoc = await getDoc(doc(db, "formularios", formularioId));
        if (!formularioDoc.exists()) {
          Swal.fire("Error", "El formulario seleccionado no existe.", "error");
          setCargandoFormulario(false);
          return;
        }
        const formularioData = formularioDoc.data();
        const meta = formularios.find(f => f.id === formularioId);
        detalle = { ...meta, ...formularioData, id: formularioId };
      } catch (error) {
        console.error("Error cargando formulario:", error);
        Swal.fire("Error", "No se pudo cargar el formulario. Verifica tu conexión.", "error");
        setCargandoFormulario(false);
        return;
      }
    }
    
    setFormularioSeleccionado(detalle);
    setCargandoFormulario(false);
  }, [formularios, formulariosCompletos]);

  return { formularioSeleccionado, setFormularioSeleccionado, cargandoFormulario, handleChangeFormulario };
};


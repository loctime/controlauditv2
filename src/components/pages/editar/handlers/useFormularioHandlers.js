import { useCallback } from 'react';
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../../firebaseControlFile";
import Swal from 'sweetalert2';
import { registrarAccionSistema } from '../../../../utils/firestoreUtils';

export const useFormularioHandlers = ({
  formularioSeleccionado,
  setFormularioSeleccionado,
  seccionesNormalizadas,
  puedeEditar,
  puedeEliminar,
  user
}) => {
  
  const handleGuardarCambiosFormulario = useCallback(async (
    nuevoNombreFormulario,
    nuevoEstado,
    nuevaVersion,
    nuevoEsPublico,
    setAccordionOpen
  ) => {
    if (!puedeEditar) {
      console.log('[DEBUG] Usuario no tiene permisos para editar:', {
        puedeEditar,
        formularioId: formularioSeleccionado?.id,
        usuarioId: user?.uid
      });
      Swal.fire("Error", "No tienes permisos para editar este formulario.", "error");
      return;
    }
    try {
      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, {
        nombre: nuevoNombreFormulario,
        estado: nuevoEstado,
        version: nuevaVersion,
        esPublico: nuevoEsPublico,
        ultimaModificacion: new Date()
      });
      setFormularioSeleccionado(prev => ({
        ...prev,
        nombre: nuevoNombreFormulario,
        estado: nuevoEstado,
        version: nuevaVersion,
        esPublico: nuevoEsPublico,
        ultimaModificacion: new Date()
      }));
      
      // Registrar log
      await registrarAccionSistema(
        user?.uid,
        `Formulario editado: ${nuevoNombreFormulario}`,
        {
          formularioId: formularioSeleccionado.id,
          nombreAnterior: formularioSeleccionado.nombre,
          nombreNuevo: nuevoNombreFormulario,
          estado: nuevoEstado,
          version: nuevaVersion
        },
        'editar',
        'formulario',
        formularioSeleccionado.id
      );
      
      Swal.fire("Éxito", "Formulario actualizado exitosamente.", "success");
      setAccordionOpen(false);
    } catch (error) {
      console.error("Error al actualizar formulario:", error);
      Swal.fire("Error", "Error al actualizar el formulario.", "error");
    }
  }, [puedeEditar, formularioSeleccionado.id, setFormularioSeleccionado, user]);

  const handleGuardarCambiosSeccion = useCallback(async (
    seccionSeleccionada,
    nuevoNombreSeccion,
    setModalEditarSeccionAbierto
  ) => {
    if (!puedeEditar) {
      Swal.fire("Error", "No tienes permisos para editar este formulario.", "error");
      return;
    }

    try {
      if (!seccionSeleccionada) {
        Swal.fire("Error", "No se ha seleccionado ninguna sección.", "error");
        return;
      }

      const seccionesActualizadas = seccionesNormalizadas.map(seccion => 
        seccion.nombre === seccionSeleccionada.nombre 
          ? { ...seccion, nombre: nuevoNombreSeccion }
          : seccion
      );

      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { 
        secciones: seccionesActualizadas,
        ultimaModificacion: new Date()
      });
      setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
      setModalEditarSeccionAbierto(false);
      Swal.fire("Éxito", "Sección actualizada exitosamente.", "success");
    } catch (error) {
      console.error("Error al actualizar sección:", error);
      Swal.fire("Error", "Error al actualizar la sección.", "error");
    }
  }, [puedeEditar, seccionesNormalizadas, formularioSeleccionado.id, setFormularioSeleccionado]);

  const handleGuardarCambiosPregunta = useCallback(async (
    preguntaSeleccionada,
    nuevoTextoPregunta,
    setModalEditarPreguntaAbierto
  ) => {
    console.log('🔧 [DEBUG] handleGuardarCambiosPregunta llamado');
    console.log('🔧 [DEBUG] puedeEditar:', puedeEditar);
    console.log('🔧 [DEBUG] preguntaSeleccionada:', preguntaSeleccionada);
    console.log('🔧 [DEBUG] nuevoTextoPregunta:', nuevoTextoPregunta);
    console.log('🔧 [DEBUG] seccionesNormalizadas:', seccionesNormalizadas);
    
    if (!puedeEditar) {
      console.log('🔧 [DEBUG] Usuario no tiene permisos para editar');
      Swal.fire("Error", "No tienes permisos para editar este formulario.", "error");
      return;
    }

    try {
      if (!preguntaSeleccionada) {
        console.log('🔧 [DEBUG] No hay pregunta seleccionada');
        Swal.fire("Error", "No se ha seleccionado ninguna pregunta.", "error");
        return;
      }

      const seccionesActualizadas = seccionesNormalizadas.map(seccion => {
        if (seccion.nombre === preguntaSeleccionada.seccionNombre) {
          const preguntasActualizadas = seccion.preguntas.map((pregunta, index) => 
            index === preguntaSeleccionada.index ? nuevoTextoPregunta : pregunta
          );
          return { ...seccion, preguntas: preguntasActualizadas };
        }
        return seccion;
      });

      console.log('🔧 [DEBUG] Secciones actualizadas:', seccionesActualizadas);
      console.log('🔧 [DEBUG] Formulario ID:', formularioSeleccionado.id);

      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { 
        secciones: seccionesActualizadas,
        ultimaModificacion: new Date()
      });
      
      console.log('🔧 [DEBUG] Documento actualizado en Firestore exitosamente');
      
      setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
      setModalEditarPreguntaAbierto(false);
      Swal.fire("Éxito", "Pregunta actualizada exitosamente.", "success");
    } catch (error) {
      console.error("Error al actualizar pregunta:", error);
      Swal.fire("Error", "Error al actualizar la pregunta.", "error");
    }
  }, [puedeEditar, seccionesNormalizadas, formularioSeleccionado.id, setFormularioSeleccionado]);

  const handleGuardarNuevaPregunta = useCallback(async (
    seccionSeleccionada,
    nuevaPregunta,
    setModalAgregarPreguntaAbierto,
    setNuevaPregunta
  ) => {
    console.log('🔧 [DEBUG] handleGuardarNuevaPregunta llamado');
    console.log('🔧 [DEBUG] puedeEditar:', puedeEditar);
    console.log('🔧 [DEBUG] seccionSeleccionada:', seccionSeleccionada);
    console.log('🔧 [DEBUG] nuevaPregunta:', nuevaPregunta);
    console.log('🔧 [DEBUG] seccionesNormalizadas:', seccionesNormalizadas);
    
    if (!puedeEditar) {
      console.log('🔧 [DEBUG] Usuario no tiene permisos para editar');
      Swal.fire("Error", "No tienes permisos para editar este formulario.", "error");
      return;
    }

    try {
      if (!seccionSeleccionada) {
        console.log('🔧 [DEBUG] No hay sección seleccionada');
        Swal.fire("Error", "Sección no proporcionada.", "error");
        return;
      }

      const seccionesActualizadas = seccionesNormalizadas.map(seccion => {
        if (seccion.nombre === seccionSeleccionada.nombre) {
          const preguntasActualizadas = [...seccion.preguntas, nuevaPregunta];
          return { ...seccion, preguntas: preguntasActualizadas };
        }
        return seccion;
      });

      console.log('🔧 [DEBUG] Secciones actualizadas:', seccionesActualizadas);
      console.log('🔧 [DEBUG] Formulario ID:', formularioSeleccionado.id);

      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { 
        secciones: seccionesActualizadas,
        ultimaModificacion: new Date()
      });
      
      console.log('🔧 [DEBUG] Documento actualizado en Firestore exitosamente');
      
      setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
      setModalAgregarPreguntaAbierto(false);
      setNuevaPregunta('');
      Swal.fire("Éxito", "Pregunta agregada exitosamente.", "success");
    } catch (error) {
      console.error("Error al agregar pregunta:", error);
      Swal.fire("Error", "Error al agregar pregunta.", "error");
    }
  }, [puedeEditar, seccionesNormalizadas, formularioSeleccionado.id, setFormularioSeleccionado]);

  const handleEliminarFormulario = useCallback(async (id) => {
    if (!puedeEliminar) {
      Swal.fire("Error", "No tienes permisos para eliminar este formulario.", "error");
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás recuperar este formulario!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1976d2',
      cancelButtonColor: '#d32f2f',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "formularios", id));
        
        // Registrar log
        await registrarAccionSistema(
          user?.uid,
          `Formulario eliminado: ${formularioSeleccionado?.nombre || 'Sin nombre'}`,
          {
            formularioId: id,
            nombre: formularioSeleccionado?.nombre
          },
          'eliminar',
          'formulario',
          id
        );
        
        setFormularioSeleccionado(null);
        // Limpiar cache
        localStorage.removeItem(`formulario_${id}`);
        Swal.fire("Eliminado", "Formulario eliminado exitosamente.", "success");
      } catch (error) {
        console.error("Error al eliminar formulario:", error);
        Swal.fire("Error", "Error al eliminar el formulario.", "error");
      }
    }
  }, [puedeEliminar, setFormularioSeleccionado]);

  const handleEliminarSeccion = useCallback(async (nombreSeccion) => {
    if (!puedeEliminar) {
      Swal.fire("Error", "No tienes permisos para eliminar secciones.", "error");
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás recuperar esta sección y sus preguntas!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1976d2',
      cancelButtonColor: '#d32f2f',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        const seccionesActualizadas = seccionesNormalizadas.filter(seccion => seccion.nombre !== nombreSeccion);
        const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
        await updateDoc(formularioRef, { 
          secciones: seccionesActualizadas,
          ultimaModificacion: new Date()
        });
        setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
        Swal.fire("Eliminado", "Sección eliminada exitosamente.", "success");
      } catch (error) {
        console.error("Error al eliminar sección:", error);
        Swal.fire("Error", "Error al eliminar la sección.", "error");
      }
    }
  }, [puedeEliminar, seccionesNormalizadas, formularioSeleccionado.id, setFormularioSeleccionado]);

  const handleEliminarPregunta = useCallback(async (indexPregunta, nombreSeccion) => {
    console.log('🔧 [DEBUG] handleEliminarPregunta llamado');
    console.log('🔧 [DEBUG] puedeEliminar:', puedeEliminar);
    console.log('🔧 [DEBUG] indexPregunta:', indexPregunta);
    console.log('🔧 [DEBUG] nombreSeccion:', nombreSeccion);
    console.log('🔧 [DEBUG] seccionesNormalizadas:', seccionesNormalizadas);
    
    if (!puedeEliminar) {
      console.log('🔧 [DEBUG] Usuario no tiene permisos para eliminar');
      Swal.fire("Error", "No tienes permisos para eliminar preguntas.", "error");
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás recuperar esta pregunta!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1976d2',
      cancelButtonColor: '#d32f2f',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        const seccionesActualizadas = seccionesNormalizadas.map(seccion => {
          if (seccion.nombre === nombreSeccion) {
            const preguntasActualizadas = seccion.preguntas.filter((_, idx) => idx !== indexPregunta);
            return { ...seccion, preguntas: preguntasActualizadas };
          }
          return seccion;
        });

        console.log('🔧 [DEBUG] Secciones actualizadas:', seccionesActualizadas);
        console.log('🔧 [DEBUG] Formulario ID:', formularioSeleccionado.id);

        const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
        await updateDoc(formularioRef, { 
          secciones: seccionesActualizadas,
          ultimaModificacion: new Date()
        });
        
        console.log('🔧 [DEBUG] Documento actualizado en Firestore exitosamente');
        
        setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
        Swal.fire("Eliminado", "Pregunta eliminada exitosamente.", "success");
      } catch (error) {
        console.error("Error al eliminar pregunta:", error);
        Swal.fire("Error", "Error al eliminar la pregunta.", "error");
      }
    }
  }, [puedeEliminar, seccionesNormalizadas, formularioSeleccionado.id, setFormularioSeleccionado]);

  const handleAgregarSeccion = useCallback(async (nombreSeccion) => {
    console.log('🔧 [DEBUG] handleAgregarSeccion llamado');
    console.log('🔧 [DEBUG] puedeEditar:', puedeEditar);
    console.log('🔧 [DEBUG] nombreSeccion:', nombreSeccion);
    
    if (!puedeEditar) {
      console.log('🔧 [DEBUG] Usuario no tiene permisos para editar');
      Swal.fire("Error", "No tienes permisos para agregar secciones.", "error");
      return;
    }

    try {
      if (!nombreSeccion || !nombreSeccion.trim()) {
        Swal.fire("Error", "El nombre de la sección es requerido.", "error");
        return;
      }

      const nuevaSeccion = {
        nombre: nombreSeccion.trim(),
        preguntas: []
      };

      const seccionesActualizadas = [...seccionesNormalizadas, nuevaSeccion];

      console.log('🔧 [DEBUG] Secciones actualizadas:', seccionesActualizadas);
      console.log('🔧 [DEBUG] Formulario ID:', formularioSeleccionado.id);

      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { 
        secciones: seccionesActualizadas,
        ultimaModificacion: new Date()
      });
      
      console.log('🔧 [DEBUG] Documento actualizado en Firestore exitosamente');
      
      setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
      Swal.fire("Éxito", "Sección agregada exitosamente.", "success");
    } catch (error) {
      console.error("Error al agregar sección:", error);
      Swal.fire("Error", "Error al agregar la sección.", "error");
    }
  }, [puedeEditar, seccionesNormalizadas, formularioSeleccionado.id, setFormularioSeleccionado]);

  return {
    handleGuardarCambiosFormulario,
    handleGuardarCambiosSeccion,
    handleGuardarCambiosPregunta,
    handleGuardarNuevaPregunta,
    handleAgregarSeccion,
    handleEliminarFormulario,
    handleEliminarSeccion,
    handleEliminarPregunta
  };
};

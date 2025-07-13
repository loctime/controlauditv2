import { useState, useCallback } from 'react';
import { useAuth } from '../components/context/AuthContext';
import { logUserAction } from '../components/pages/usuarios/LogsOperarios';
import BACKEND_CONFIG from '../config/backend';
import Swal from 'sweetalert2';

const useFirmaDigital = () => {
  const { userProfile } = useAuth();
  const [isFirmando, setIsFirmando] = useState(false);

  // Función para obtener el token de autenticación
  const getToken = useCallback(async () => {
    try {
      // Obtener token del usuario actual
      return await userProfile?.getIdToken?.();
    } catch (error) {
      console.error('Error obteniendo token:', error);
      return null;
    }
  }, [userProfile]);

  // Función para hacer peticiones al backend
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = await getToken();
    if (!token) {
      throw new Error('No se pudo obtener el token de autenticación');
    }

    const response = await fetch(`${BACKEND_CONFIG.URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }, [getToken]);

  // 1. Firmar documento
  const firmarDocumento = useCallback(async (documentoId, tipoDocumento = 'documento', datosAdicionales = {}, contenidoDocumento = '') => {
    if (!userProfile?.firmaDigital) {
      Swal.fire({
        title: 'Firma no configurada',
        text: 'Debes configurar tu firma digital en tu perfil antes de poder firmar documentos.',
        icon: 'warning',
        confirmButtonText: 'Ir al Perfil',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // Redirigir al perfil
          window.location.href = '/perfil?tab=firma';
        }
      });
      return false;
    }

    setIsFirmando(true);
    
    try {
      const resultado = await apiCall('/api/firmar-documento', {
        method: 'POST',
        body: JSON.stringify({
          documentoId,
          tipoDocumento,
          firmaDigital: userProfile.firmaDigital,
          contenidoDocumento,
          datosAdicionales
        })
      });

      // Log de la acción
      await logUserAction('documento_firmado', {
        detalles: `Documento ${tipoDocumento} firmado`,
        documentoId,
        tipoDocumento,
        certificado: resultado.certificado,
        ...datosAdicionales
      });

      Swal.fire({
        title: 'Documento Firmado',
        text: 'El documento ha sido firmado exitosamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      return resultado;
    } catch (error) {
      console.error('Error al firmar documento:', error);
      Swal.fire('Error', error.message || 'Error al firmar el documento', 'error');
      return false;
    } finally {
      setIsFirmando(false);
    }
  }, [userProfile, apiCall]);

  // 2. Verificar si el documento ya está firmado por el usuario
  const verificarFirma = useCallback(async (documentoId, usuarioId = null) => {
    try {
      const targetUserId = usuarioId || userProfile?.uid;
      if (!targetUserId) return false;

      const resultado = await apiCall(`/api/verificar-firma/${documentoId}/${targetUserId}`);
      return resultado.firmado ? resultado.firma : false;
    } catch (error) {
      console.error('Error al verificar firma:', error);
      return false;
    }
  }, [userProfile, apiCall]);

  // 3. Obtener todas las firmas de un documento (solo para supermax)
  const obtenerFirmasDocumento = useCallback(async (documentoId) => {
    try {
      const resultado = await apiCall(`/api/firmas-documento/${documentoId}`);
      return resultado;
    } catch (error) {
      console.error('Error al obtener firmas del documento:', error);
      return { firmas: [], totalFirmas: 0 };
    }
  }, [apiCall]);

  // 4. Validar certificado digital
  const validarCertificado = useCallback(async (documentoId, usuarioId, certificado, contenidoDocumento = '') => {
    try {
      const resultado = await apiCall('/api/validar-certificado', {
        method: 'POST',
        body: JSON.stringify({
          documentoId,
          usuarioId,
          certificado,
          contenidoDocumento
        })
      });
      return resultado;
    } catch (error) {
      console.error('Error al validar certificado:', error);
      return { valido: false, error: error.message };
    }
  }, [apiCall]);

  // 5. Obtener estadísticas de firmas del usuario
  const obtenerEstadisticasFirmas = useCallback(async () => {
    try {
      const resultado = await apiCall('/api/estadisticas-firmas');
      return resultado;
    } catch (error) {
      console.error('Error al obtener estadísticas de firmas:', error);
      return { totalFirmas: 0, porTipo: {}, ultimaFirma: null };
    }
  }, [apiCall]);

  // 6. Función helper para generar hash del contenido
  const generarHashContenido = useCallback((contenido) => {
    // Función simple para generar hash del contenido
    // En producción, podrías usar una librería como crypto-js
    let hash = 0;
    if (contenido.length === 0) return hash.toString();
    
    for (let i = 0; i < contenido.length; i++) {
      const char = contenido.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }, []);

  return {
    // Funciones principales
    firmarDocumento,
    verificarFirma,
    obtenerFirmasDocumento,
    validarCertificado,
    obtenerEstadisticasFirmas,
    
    // Estados
    isFirmando,
    tieneFirma: !!userProfile?.firmaDigital,
    firmaDigital: userProfile?.firmaDigital,
    
    // Helpers
    generarHashContenido,
    
    // Configuración
    backendUrl: BACKEND_CONFIG.URL
  };
};

export default useFirmaDigital; 
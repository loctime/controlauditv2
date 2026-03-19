import logger from '@/utils/logger';
// Componente optimizado para generar reportes de auditoría
import React, { useState } from "react";
import { Button, Box, Alert, Snackbar, CircularProgress } from "@mui/material";
import { useAuth } from '@/components/context/AuthContext';
import AuditoriaService from "../auditoriaService";
import { buildReporteMetadata } from '../../../../services/useMetadataService';
import { getOfflineDatabase } from '../../../../services/offlineDatabase';
const BotonGenerarReporte = ({ 
  onClick, 
  deshabilitado, 
  empresa, 
  sucursal, 
  formulario, 
  respuestas, 
  comentarios, 
  imagenes, 
  clasificaciones,
  secciones,
  firmaAuditor,
  firmaResponsable,
  onFinalizar
}) => {
  const { user, userProfile } = useAuth();
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("success");
  const [mostrarMensaje, setMostrarMensaje] = useState(false);

  const handleGuardar = async () => {
    if (!empresa || !formulario) {
      setMensaje("Error: Faltan datos requeridos para guardar");
      setTipoMensaje("error");
      setMostrarMensaje(true);
      return;
    }

    // Las firmas son opcionales - no validar como obligatorias
    logger.debug('[BotonGenerarReporte] Firmas opcionales - Auditor:', !!firmaAuditor, 'Responsable:', !!firmaResponsable);
    
    // Debug de clasificaciones
    logger.debug('🔍 [BotonGenerarReporte] handleGuardar - clasificaciones recibidas como prop:', clasificaciones);
    logger.debug('🔍 [BotonGenerarReporte] handleGuardar - Tipo:', typeof clasificaciones, Array.isArray(clasificaciones));
    if (Array.isArray(clasificaciones) && clasificaciones.length > 0) {
      logger.debug('🔍 [BotonGenerarReporte] handleGuardar - Contenido:', JSON.stringify(clasificaciones, null, 2));
    } else {
      logger.warn('🔍 [BotonGenerarReporte] handleGuardar - ⚠️ clasificaciones está vacío o no es array!');
    }

    setGuardando(true);
    try {
      // Obtener userProfile del cache si no está disponible (modo offline)
      let currentUserProfile = userProfile;
      
      if (!currentUserProfile) {
        logger.debug('[BotonGenerarReporte] userProfile no disponible, buscando en cache...');
        try {
          const db = await getOfflineDatabase();
          const cached = await db.get('settings', 'complete_user_cache');
          if (cached?.value?.userProfile) {
            currentUserProfile = cached.value.userProfile;
            logger.debug('[BotonGenerarReporte] Usuario encontrado en cache:', {
              uid: currentUserProfile.uid,
              email: currentUserProfile.email,
              displayName: currentUserProfile.displayName,
              role: currentUserProfile.role
            });
          } else {
            logger.debug('[BotonGenerarReporte] No se encontró usuario en cache');
          }
        } catch (error) {
          logger.error('[BotonGenerarReporte] Error al obtener usuario del cache:', error);
          // Continuar sin userProfile del cache
        }
      }

      // Construir metadatos consistentes y multi-tenant
      const datosAuditoria = buildReporteMetadata({
        empresa,
        sucursal,
        formulario,
        respuestas,
        comentarios,
        imagenes,
        clasificaciones,
        secciones,
        firmaAuditor,
        firmaResponsable,
        datosReporte, // Incluir los datos adicionales del reporte
        fechaGuardado: new Date(),
      });
      logger.debug('🔍 [BotonGenerarReporte] Clasificaciones recibidas como prop:', clasificaciones);
      logger.debug('🔍 [BotonGenerarReporte] Tipo de clasificaciones:', typeof clasificaciones, Array.isArray(clasificaciones));
      logger.debug('[BotonGenerarReporte] Guardando auditoría con metadatos:', datosAuditoria);
      logger.debug('🔍 [BotonGenerarReporte] Clasificaciones en datosAuditoria:', datosAuditoria.clasificaciones);

      // Usar el servicio centralizado para guardar
      const { id: auditoriaId, uploadFailures } = await AuditoriaService.guardarAuditoria(datosAuditoria, currentUserProfile);

      setGuardadoExitoso(true);
      const tipoUbicacion = sucursal && sucursal.trim() !== "" ? "Sucursal" : "Casa Central";

      if (uploadFailures && uploadFailures.length > 0) {
        logger.warn('[BotonGenerarReporte] Auditoría guardada pero con imágenes que no pudieron subirse:', uploadFailures);
        setMensaje(`⚠️ Auditoría guardada (ID: ${auditoriaId}), pero ${uploadFailures.length} imagen(es) no pudieron subirse. Podés reintentar desde Reportes.`);
        setTipoMensaje("warning");
      } else {
        setMensaje(`✅ Auditoría de ${tipoUbicacion.toLowerCase()} guardada exitosamente con ID: ${auditoriaId}`);
        setTipoMensaje("success");
      }
      setMostrarMensaje(true);
      
      // Llamar callback de finalización
      if (onFinalizar) {
        onFinalizar();
      }
    } catch (error) {
      setGuardadoExitoso(false);
      logger.error("❌ Error al guardar auditoría:", error);
      setMensaje(`❌ Error al guardar: ${error.message}`);
      setTipoMensaje("error");
      setMostrarMensaje(true);
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrarMensaje = () => {
    setMostrarMensaje(false);
  };

  return (
    <Box mt={3} display="flex" gap={2} justifyContent="center">
      <Button
        variant="contained"
        color="success"
        onClick={handleGuardar}
        disabled={deshabilitado || guardando || guardadoExitoso}
        size="large"
        startIcon={guardando ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {guardando ? "Guardando..." : "Guardar en Reportes"}
      </Button>
      
      {/* Botón Finalizar solo visible tras guardado exitoso */}
      {guardadoExitoso && (
        <Button
          variant="contained"
          color="primary"
          onClick={onFinalizar}
          size="large"
        >
          Finalizar
        </Button>
      )}
      
      {/* Mensajes */}
      <Snackbar
        open={mostrarMensaje}
        autoHideDuration={6000}
        onClose={handleCerrarMensaje}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCerrarMensaje} 
          severity={tipoMensaje} 
          sx={{ width: '100%' }}
        >
          {mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BotonGenerarReporte;

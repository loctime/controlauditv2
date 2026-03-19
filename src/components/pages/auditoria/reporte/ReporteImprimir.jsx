import logger from '@/utils/logger';
// Componente optimizado para generar reportes de auditoría
import React, { useState } from "react";
import { Button, Box, Alert, Snackbar, CircularProgress } from "@mui/material";
import { useAuth } from '@/components/context/AuthContext';
import AuditoriaService from "../auditoriaService";
import { buildReporteMetadata } from '../../../../services/useMetadataService';
import autoSaveService from "../auditoria/services/autoSaveService";
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
  accionesRequeridas,
  secciones,
  firmaAuditor,
  firmaResponsable,
  datosReporte = {},
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
    logger.debug('[ReporteImprimir] Firmas opcionales - Auditor:', !!firmaAuditor, 'Responsable:', !!firmaResponsable);

    setGuardando(true);
    try {
      // Obtener userProfile del cache si no está disponible (modo offline)
      let currentUserProfile = userProfile;
      
      if (!currentUserProfile) {
        logger.debug('[ReporteImprimir] userProfile no disponible, buscando en cache...');
        try {
          // Verificar si IndexedDB está disponible
          if (!window.indexedDB) {
            logger.warn('[ReporteImprimir] IndexedDB no está disponible');
            throw new Error('IndexedDB no disponible');
          }

          const request = indexedDB.open('controlaudit_offline_v1', 2);
          const cachedUser = await new Promise((resolve, reject) => {
            request.onsuccess = function(event) {
              const db = event.target.result;
              
              // Verificar si la object store 'settings' existe
              if (!db.objectStoreNames.contains('settings')) {
                logger.warn('[ReporteImprimir] Object store "settings" no existe');
                resolve(null);
                return;
              }
              
              const transaction = db.transaction(['settings'], 'readonly');
              const store = transaction.objectStore('settings');
              
              store.get('complete_user_cache').onsuccess = function(e) {
                const cached = e.target.result;
                if (cached && cached.value && cached.value.userProfile) {
                  resolve(cached.value.userProfile);
                } else {
                  resolve(null);
                }
              };
              
              store.get('complete_user_cache').onerror = function(e) {
                logger.error('[ReporteImprimir] Error al obtener cache:', e.target.error);
                resolve(null);
              };
            };
            
            request.onerror = function(event) {
              logger.error('[ReporteImprimir] Error al abrir IndexedDB:', event.target.error);
              reject(event.target.error);
            };
            
            request.onupgradeneeded = function(event) {
              logger.debug('[ReporteImprimir] IndexedDB necesita actualización');
              // .No hacer nada aquí, solo para evitar errores
            };
          });
          
          if (cachedUser) {
            currentUserProfile = cachedUser;
            logger.debug('[ReporteImprimir] Usuario encontrado en cache:', {
              uid: currentUserProfile.uid,
              email: currentUserProfile.email,
              displayName: currentUserProfile.displayName,
              role: currentUserProfile.role,
              ownerId: currentUserProfile.ownerId
            });
          } else {
            logger.debug('[ReporteImprimir] No se encontró usuario en cache');
          }
        } catch (error) {
          logger.error('[ReporteImprimir] Error al obtener usuario del cache:', error);
          // Continuar sin userProfile del cache
        }
      }

      // Asegurar que tenemos los datos de auth correctos
      const authData = {
        ownerId: currentUserProfile?.ownerId,
        usuarioId: currentUserProfile?.uid,
        usuarioEmail: currentUserProfile?.email,
        userDisplayName: currentUserProfile?.displayName,
        userRole: currentUserProfile?.role
      };

      // Construir l metadatos consistentes y multi-tenant
      const datosAuditoria = buildReporteMetadata({
        empresa,
        sucursal,
        formulario,
        respuestas,
        comentarios,
        imagenes,
        clasificaciones,
        accionesRequeridas: accionesRequeridas || [],
        secciones,
        firmaAuditor,
        firmaResponsable,
        datosReporte,
        // Multi-tenant - asegurar que siempre tengamos estos datos
        ...authData,
        fechaGuardado: new Date(),
      });
      logger.debug('🔍 [ReporteImprimir] clasificaciones recibidas:', clasificaciones);
      logger.debug('🔍 [ReporteImprimir] clasificaciones en datosAuditoria:', datosAuditoria.clasificaciones);
      logger.debug('[ReporteImprimir] Guardando auditoría con metadatos:', datosAuditoria);
      logger.debug('[ReporteImprimir] userProfile final que se pasa al servicio:', {
        uid: currentUserProfile?.uid,
        email: currentUserProfile?.email,
        displayName: currentUserProfile?.displayName,
        role: currentUserProfile?.role,
        ownerId: currentUserProfile?.ownerId
      });

      // Usar el servicio centralizado para guardar
      const { id: auditoriaId, uploadFailures } = await AuditoriaService.guardarAuditoria(datosAuditoria, currentUserProfile);

      // Limpiar autoguardado al completar exitosamente
      try {
        await autoSaveService.clearLocalStorage(currentUserProfile?.uid);
        logger.debug('🗑️ Autoguardado limpiado después de completar auditoría');
      } catch (cleanupError) {
        logger.warn('⚠️ Error al limpiar autoguardado:', cleanupError);
      }
      
      setGuardadoExitoso(true);
      const tipoUbicacion = sucursal && sucursal.trim() !== "" ? "Sucursal" : "Casa Central";

      if (uploadFailures && uploadFailures.length > 0) {
        logger.warn('[ReporteImprimir] Auditoría guardada pero con imágenes que no pudieron subirse:', uploadFailures);
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

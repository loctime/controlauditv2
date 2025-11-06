// Componente optimizado para generar reportes de auditoría
import React, { useState } from "react";
import { Button, Box, Alert, Snackbar, CircularProgress } from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import AuditoriaService from "../auditoriaService";
import { buildReporteMetadata } from '../../../../services/useMetadataService';

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
    console.log('[BotonGenerarReporte] Firmas opcionales - Auditor:', !!firmaAuditor, 'Responsable:', !!firmaResponsable);

    setGuardando(true);
    try {
      // Obtener userProfile del cache si no está disponible (modo offline)
      let currentUserProfile = userProfile;
      
      if (!currentUserProfile) {
        console.log('[BotonGenerarReporte] userProfile no disponible, buscando en cache...');
        try {
          // Verificar si IndexedDB está disponible
          if (!window.indexedDB) {
            console.warn('[BotonGenerarReporte] IndexedDB no está disponible');
            throw new Error('IndexedDB no disponible');
          }

          const request = indexedDB.open('controlaudit_offline_v1', 2);
          const cachedUser = await new Promise((resolve, reject) => {
            request.onsuccess = function(event) {
              const db = event.target.result;
              
              // Verificar si la object store 'settings' existe
              if (!db.objectStoreNames.contains('settings')) {
                console.warn('[BotonGenerarReporte] Object store "settings" no existe');
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
                console.error('[BotonGenerarReporte] Error al obtener cache:', e.target.error);
                resolve(null);
              };
            };
            
            request.onerror = function(event) {
              console.error('[BotonGenerarReporte] Error al abrir IndexedDB:', event.target.error);
              reject(event.target.error);
            };
            
            request.onupgradeneeded = function(event) {
              console.log('[BotonGenerarReporte] IndexedDB necesita actualización');
              // No hacer nada aquí, solo para evitar errores
            };
          });
          
          if (cachedUser) {
            currentUserProfile = cachedUser;
            console.log('[BotonGenerarReporte] Usuario encontrado en cache:', {
              uid: currentUserProfile.uid,
              email: currentUserProfile.email,
              displayName: currentUserProfile.displayName,
              role: currentUserProfile.role,
              clienteAdminId: currentUserProfile.clienteAdminId,
              clienteAdminIdFallback: currentUserProfile.clienteAdminId || currentUserProfile.uid
            });
          } else {
            console.log('[BotonGenerarReporte] No se encontró usuario en cache');
          }
        } catch (error) {
          console.error('[BotonGenerarReporte] Error al obtener usuario del cache:', error);
          // Continuar sin userProfile del cache
        }
      }

      // Asegurar que tenemos los datos de auth correctos
      const authData = {
        clienteAdminId: currentUserProfile?.clienteAdminId || currentUserProfile?.uid,
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
        secciones,
        firmaAuditor,
        firmaResponsable,
        // Multi-tenant - asegurar que siempre tengamos estos datos
        ...authData,
        fechaGuardado: new Date(),
      });
      console.debug('[BotonGenerarReporte] Guardando auditoría con metadatos:', datosAuditoria);
      console.log('[BotonGenerarReporte] userProfile final que se pasa al servicio:', {
        uid: currentUserProfile?.uid,
        email: currentUserProfile?.email,
        displayName: currentUserProfile?.displayName,
        role: currentUserProfile?.role,
        clienteAdminId: currentUserProfile?.clienteAdminId,
        clienteAdminIdFallback: currentUserProfile?.clienteAdminId || currentUserProfile?.uid
      });

      // Usar el servicio centralizado para guardar
      const auditoriaId = await AuditoriaService.guardarAuditoria(datosAuditoria, currentUserProfile);
      
      setGuardadoExitoso(true);
      const tipoUbicacion = sucursal && sucursal.trim() !== "" ? "Sucursal" : "Casa Central";
      setMensaje(`✅ Auditoría de ${tipoUbicacion.toLowerCase()} guardada exitosamente con ID: ${auditoriaId}`);
      setTipoMensaje("success");
      setMostrarMensaje(true);
      
      // Llamar callback de finalización
      if (onFinalizar) {
        onFinalizar();
      }
    } catch (error) {
      setGuardadoExitoso(false);
      console.error("❌ Error al guardar auditoría:", error);
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

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
          const request = indexedDB.open('controlaudit_offline_v1', 2);
          const cachedUser = await new Promise((resolve, reject) => {
            request.onsuccess = function(event) {
              const db = event.target.result;
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
            };
            request.onerror = function(event) {
              reject(event.target.error);
            };
          });
          
          if (cachedUser) {
            currentUserProfile = cachedUser;
            console.log('[BotonGenerarReporte] Usuario encontrado en cache:', currentUserProfile.uid);
          }
        } catch (error) {
          console.error('[BotonGenerarReporte] Error al obtener usuario del cache:', error);
        }
      }

      // Construir l metadatos consistentes y multi-tenant
      const datosAuditoria = buildReporteMetadata({
        empresa,
        sucursal,
        formulario,
        respuestas,
        comentarios,
        imagenes,
        secciones,
        firmaAuditor,
        firmaResponsable,
        // Multi-tenant
        clienteAdminId: currentUserProfile?.clienteAdminId || currentUserProfile?.uid,
        usuarioId: currentUserProfile?.uid,
        usuarioEmail: currentUserProfile?.email,
        fechaGuardado: new Date(),
      });
      console.debug('[BotonGenerarReporte] Guardando auditoría con metadatos:', datosAuditoria);

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

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function BlockTitle({ children }) {
  return <Typography variant="h6" sx={{ mt: 2 }}>{children}</Typography>;
}

export default function UserGuideDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ pr: 6 }}>
        Guia de usuario - Modulo de capacitacion
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Typography>
            Esta guia resume el uso actual del modulo de capacitacion para equipos de Higiene y Seguridad.
          </Typography>

          <BlockTitle>1. Navegacion del modulo</BlockTitle>
          <Typography><strong>Tablero:</strong> indicadores, alertas, accesos rapidos y calendario como vista secundaria.</Typography>
          <Typography><strong>Sesiones:</strong> alta de sesiones, seleccion de participantes, ejecucion, evidencias y cierre.</Typography>
          <Typography><strong>Personas:</strong> ficha del empleado e historial con vigencia y vencimiento.</Typography>
          <Typography><strong>Reportes:</strong> estado operativo y cumplimiento por sucursal/puesto.</Typography>
          <Typography><strong>Configuracion:</strong> catalogo, matriz de requerimientos y planes anuales (perfil admin).</Typography>

          <BlockTitle>2. Flujo operativo recomendado</BlockTitle>
          <Typography>1) Configurar catalogo, matriz y plan anual (si aplica).</Typography>
          <Typography>2) Crear sesion (tipo, empresa, sucursal, instructor, fecha y modalidad).</Typography>
          <Typography>3) Seleccionar participantes sugeridos y confirmar creacion.</Typography>
          <Typography>4) Iniciar sesion y registrar asistencia/evaluacion por participante.</Typography>
          <Typography>5) Cargar evidencias y referencias de firma.</Typography>
          <Typography>6) Pasar a pendiente de cierre y validar criterios.</Typography>
          <Typography>7) Cerrar sesion cuando todas las validaciones esten completas.</Typography>

          <BlockTitle>3. Uso rapido por pantalla</BlockTitle>
          <Typography><strong>Sesiones:</strong> el hub principal para crear, ejecutar y cerrar sesiones.</Typography>
          <Typography><strong>Personas:</strong> revisar vigentes, por vencer, vencidas e incompletas por empleado.</Typography>
          <Typography><strong>Reportes:</strong> priorizar acciones por estado y cumplimiento.</Typography>
          <Typography><strong>Tablero:</strong> monitoreo diario y acceso al calendario de sesiones.</Typography>

          <BlockTitle>4. Buenas practicas</BlockTitle>
          <Typography>1) Evitar cerrar sesiones sin revisar validaciones de asistencia, evaluacion y evidencia.</Typography>
          <Typography>2) Registrar instructor y participantes con datos identificables por nombre.</Typography>
          <Typography>3) Revisar Personas y Reportes al finalizar cada jornada para detectar desvíos.</Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

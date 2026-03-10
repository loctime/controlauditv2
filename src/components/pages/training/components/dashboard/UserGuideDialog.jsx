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
        Guia de Usuario - Modulo de Capacitacion
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Typography>
            Esta guia explica como usar el modulo para gestionar la capacitacion en seguridad y cumplimiento.
          </Typography>

          <BlockTitle>1. Que hace cada pestana</BlockTitle>
          <Typography><strong>Tablero:</strong> muestra indicadores de cumplimiento, estado operativo, alertas y accesos rapidos.</Typography>
          <Typography><strong>Sesiones:</strong> permite crear sesiones, asignar participantes, registrar asistencia/evaluacion, cargar evidencias y cerrar sesiones.</Typography>
          <Typography><strong>Calendario:</strong> vista mensual de sesiones programadas. Al seleccionar un dia, se muestran sus sesiones.</Typography>
          <Typography><strong>Personas:</strong> historial por empleado con estado de vigencia de cada capacitacion.</Typography>
          <Typography><strong>Certificados:</strong> emision y gestion de certificados (ver, descargar, revocar).</Typography>
          <Typography><strong>Configuracion:</strong> parametros administrativos (catalogo, matriz de requerimientos, planes anuales).</Typography>
          <Typography><strong>Reportes:</strong> seguimiento operativo y de cumplimiento por estado, sucursal y vencimientos.</Typography>

          <BlockTitle>2. Flujo correcto para administradores</BlockTitle>
          <Typography>1) Configurar catalogo de capacitaciones.</Typography>
          <Typography>2) Definir matriz de requerimientos por puesto, sector y riesgo.</Typography>
          <Typography>3) Cargar planes anuales.</Typography>
          <Typography>4) Crear sesiones y asignar participantes sugeridos por cumplimiento.</Typography>
          <Typography>5) Validar evidencias, firmas y cierre de sesion.</Typography>
          <Typography>6) Emitir o revocar certificados segun resultados.</Typography>
          <Typography>7) Revisar reportes y alertas para acciones correctivas.</Typography>

          <BlockTitle>3. Flujo correcto para usuarios operativos</BlockTitle>
          <Typography>1) Entrar a Sesiones y abrir la sesion asignada.</Typography>
          <Typography>2) Registrar asistencia (presente o ausencias) y evaluacion.</Typography>
          <Typography>3) Cargar evidencias y referencias de firma.</Typography>
          <Typography>4) Dejar la sesion en pendiente de cierre o cerrarla si se cumplen validaciones.</Typography>
          <Typography>5) Consultar Personas para verificar vigencias por empleado.</Typography>

          <BlockTitle>4. Instrucciones paso a paso</BlockTitle>
          <Typography><strong>Configurar el sistema</strong></Typography>
          <Typography>1) Ir a Configuracion.</Typography>
          <Typography>2) En Catalogo, crear tipos de capacitacion.</Typography>
          <Typography>3) En Matriz, definir que capacitacion aplica por contexto laboral.</Typography>
          <Typography>4) En Planes anuales, cargar la planificacion del periodo.</Typography>

          <Typography><strong>Crear sesiones de capacitacion</strong></Typography>
          <Typography>1) Ir a Sesiones y completar Paso 1 (tipo, empresa, sucursal, fecha, instructor y modalidad).</Typography>
          <Typography>2) Continuar al Paso 2 y seleccionar participantes (manual + sugeridos por vencimiento/requerimiento).</Typography>
          <Typography>3) Guardar para crear la sesion.</Typography>

          <Typography><strong>Registrar asistencia</strong></Typography>
          <Typography>1) Abrir la sesion en el espacio de ejecucion.</Typography>
          <Typography>2) Cargar estado de asistencia por empleado.</Typography>
          <Typography>3) Si corresponde, registrar resultado de evaluacion.</Typography>
          <Typography>4) Registrar referencias de firma de empleado e instructor.</Typography>

          <Typography><strong>Emitir certificados</strong></Typography>
          <Typography>1) Ir a Certificados.</Typography>
          <Typography>2) Seleccionar empleado, capacitacion y sesion.</Typography>
          <Typography>3) Completar fechas y referencia de archivo.</Typography>
          <Typography>4) Emitir certificado y verificar estado.</Typography>

          <Typography><strong>Verificar cumplimiento de empleados</strong></Typography>
          <Typography>1) Ir a Personas.</Typography>
          <Typography>2) Buscar empleado en el selector.</Typography>
          <Typography>3) Revisar linea de tiempo (vigente, por vencer, vencido, incompleto).</Typography>
          <Typography>4) Usar Tablero y Reportes para priorizar acciones.</Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

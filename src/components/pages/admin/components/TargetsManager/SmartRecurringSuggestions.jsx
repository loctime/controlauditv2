// src/components/pages/admin/components/TargetsManager/SmartRecurringSuggestions.jsx
import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  Lightbulb,
  Close,
  Repeat,
  CheckCircle,
  Schedule,
  CalendarToday
} from "@mui/icons-material";
import CreateRecurringDialog from "../RecurringScheduler/CreateRecurringDialog";

/**
 * Calcula sugerencias inteligentes de programación recurrente basadas en un target
 */
const calcularSugerencias = (target) => {
  const { cantidad, periodo, año, mes, empresaNombre, sucursalNombre } = target;
  const sugerencias = [];

  if (periodo === 'mensual') {
    // Calcular auditorías por semana basado en el mes
    const diasEnMes = mes ? new Date(año, mes, 0).getDate() : 30;
    const semanasEnMes = Math.ceil(diasEnMes / 7);
    const auditoriasPorSemana = Math.ceil(cantidad / semanasEnMes);

    // Sugerencia 1: Distribución uniforme semanal
    if (auditoriasPorSemana >= 1 && auditoriasPorSemana <= 5) {
      const diasPorSemana = auditoriasPorSemana === 1 ? [1] : // Lunes
                            auditoriasPorSemana === 2 ? [1, 4] : // Lunes y Jueves
                            auditoriasPorSemana === 3 ? [1, 3, 5] : // Lunes, Miércoles, Viernes
                            auditoriasPorSemana === 4 ? [1, 2, 4, 5] : // Lunes, Martes, Jueves, Viernes
                            [1, 2, 3, 4, 5]; // Lunes a Viernes

      sugerencias.push({
        id: 'semanal-uniforme',
        titulo: `${auditoriasPorSemana} auditoría${auditoriasPorSemana > 1 ? 's' : ''} por semana`,
        descripcion: `Distribuidas uniformemente cada semana del mes`,
        frecuencia: {
          tipo: 'semanal',
          diasSemana: diasPorSemana,
          intervalo: 1
        },
        totalEstimado: auditoriasPorSemana * semanasEnMes,
        icono: <Repeat />,
        color: 'primary'
      });
    }

    // Sugerencia 2: Cada N días
    const diasEntreAuditorias = Math.floor(diasEnMes / cantidad);
    if (diasEntreAuditorias >= 1 && diasEntreAuditorias <= 14) {
      const diasSemana = [1]; // Empezar los lunes
      const intervalo = Math.ceil(diasEntreAuditorias / 7);

      sugerencias.push({
        id: 'intervalo-dias',
        titulo: `Cada ${diasEntreAuditorias} día${diasEntreAuditorias > 1 ? 's' : ''}`,
        descripcion: `Distribución equitativa a lo largo del mes`,
        frecuencia: {
          tipo: 'semanal',
          diasSemana,
          intervalo
        },
        totalEstimado: cantidad,
        icono: <Schedule />,
        color: 'secondary'
      });
    }

    // Sugerencia 3: Principio y fin de semana
    if (cantidad >= 8) {
      sugerencias.push({
        id: 'inicio-fin-semana',
        titulo: 'Principio y fin de semana',
        descripcion: 'Lunes y Viernes de cada semana',
        frecuencia: {
          tipo: 'semanal',
          diasSemana: [1, 5], // Lunes y Viernes
          intervalo: 1
        },
        totalEstimado: 2 * semanasEnMes,
        icono: <CalendarToday />,
        color: 'success'
      });
    }

    // Sugerencia 4: Días laborales (Lunes a Viernes)
    if (cantidad >= 20) {
      sugerencias.push({
        id: 'dias-laborales',
        titulo: 'Días laborales',
        descripcion: 'De lunes a viernes, cada semana',
        frecuencia: {
          tipo: 'semanal',
          diasSemana: [1, 2, 3, 4, 5],
          intervalo: 1
        },
        totalEstimado: 5 * semanasEnMes,
        icono: <CheckCircle />,
        color: 'info'
      });
    }
  } else if (periodo === 'semanal') {
    // Para target semanal, sugerir días específicos de la semana
    const diasPorSemana = cantidad <= 2 ? [1, 4] : // Lunes y Jueves
                          cantidad === 3 ? [1, 3, 5] : // Lunes, Miércoles, Viernes
                          cantidad === 4 ? [1, 2, 4, 5] : // Lunes, Martes, Jueves, Viernes
                          [1, 2, 3, 4, 5]; // Lunes a Viernes

    sugerencias.push({
      id: 'semanal-fijo',
      titulo: `${cantidad} auditoría${cantidad > 1 ? 's' : ''} por semana`,
      descripcion: `Distribuidas a lo largo de la semana`,
      frecuencia: {
        tipo: 'semanal',
        diasSemana: diasPorSemana.slice(0, cantidad),
        intervalo: 1
      },
      totalEstimado: cantidad,
      icono: <Repeat />,
      color: 'primary'
    });
  } else if (periodo === 'anual') {
    // Para target anual, sugerir distribución mensual
    const auditoriasPorMes = Math.ceil(cantidad / 12);
    const diasPorMes = auditoriasPorMes <= 2 ? [1, 15] : // Día 1 y 15 del mes
                       auditoriasPorMes === 3 ? [1, 10, 20] : // Días 1, 10, 20
                       [1, 8, 15, 22]; // Días 1, 8, 15, 22

    sugerencias.push({
      id: 'mensual-anual',
      titulo: `${auditoriasPorMes} auditoría${auditoriasPorMes > 1 ? 's' : ''} por mes`,
      descripcion: `Distribución mensual para cumplir el target anual`,
      frecuencia: {
        tipo: 'mensual',
        diaMes: diasPorMes[0], // Primer día
        intervalo: 1
      },
      totalEstimado: auditoriasPorMes * 12,
      icono: <CalendarToday />,
      color: 'primary'
    });
  }

  return sugerencias.slice(0, 4); // Máximo 4 sugerencias
};

const SmartRecurringSuggestions = ({
  open,
  onClose,
  target,
  empresas,
  sucursales,
  formularios
}) => {
  const [openRecurringDialog, setOpenRecurringDialog] = useState(false);
  const [recurringPreset, setRecurringPreset] = useState(null);

  const sugerencias = useMemo(() => {
    if (!target) return [];
    return calcularSugerencias(target);
  }, [target]);

  const handleUsarSugerencia = (sugerencia) => {
    if (!target || !formularios || formularios.length === 0) {
      return;
    }

    // Pre-llenar datos para CreateRecurringDialog
    const preset = {
      nombre: `${target.empresaNombre}${target.sucursalNombre ? ' - ' + target.sucursalNombre : ''} - ${sugerencia.titulo}`,
      empresaId: target.empresaId,
      empresaNombre: target.empresaNombre,
      sucursalId: target.sucursalId || null,
      sucursalNombre: target.sucursalNombre || null,
      formularioId: formularios[0]?.id || '',
      formularioNombre: formularios[0]?.nombre || '',
      encargadoId: '',
      frecuencia: sugerencia.frecuencia,
      hora: '09:00',
      fechaInicio: target.mes 
        ? new Date(target.año, target.mes - 1, 1).toISOString().split('T')[0]
        : new Date(target.año, 0, 1).toISOString().split('T')[0],
      fechaFin: target.mes
        ? new Date(target.año, target.mes, 0).toISOString().split('T')[0]
        : null,
      activa: true
    };

    setRecurringPreset(preset);
    setOpenRecurringDialog(true);
  };

  const handleCloseRecurringDialog = () => {
    setOpenRecurringDialog(false);
    setRecurringPreset(null);
    onClose(); // Cerrar también el modal de sugerencias
  };

  const handleSaveRecurring = () => {
    setOpenRecurringDialog(false);
    setRecurringPreset(null);
    onClose();
  };

  const getDiasSemanaLabel = (dias) => {
    const diasLabels = {
      0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb'
    };
    return dias.map(d => diasLabels[d] || d).join(', ');
  };

  if (!target) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Lightbulb color="warning" sx={{ fontSize: 28 }} />
              <Typography variant="h6" component="div">
                💡 Sugerencias Inteligentes
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Target: <strong>{target.cantidad} auditoría{target.cantidad > 1 ? 's' : ''}</strong> para{' '}
            <strong>{target.empresaNombre}</strong>
            {target.sucursalNombre && (
              <> - <strong>{target.sucursalNombre}</strong></>
            )}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
            Te sugerimos estas opciones para configurar la programación automática y cumplir tu target:
          </Typography>

          {sugerencias.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                No hay sugerencias disponibles para este target.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={onClose}
                sx={{ mt: 2 }}
              >
                Configurar manualmente
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {sugerencias.map((sugerencia) => (
                <Grid item xs={12} sm={6} key={sugerencia.id}>
                  <Card
                    elevation={2}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        elevation: 4,
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={() => handleUsarSugerencia(sugerencia)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: `${sugerencia.color}.100`,
                            color: `${sugerencia.color}.main`,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {React.cloneElement(sugerencia.icono, { fontSize: 24 })}
                        </Box>
                        <Typography variant="h6" component="div" fontWeight="bold">
                          {sugerencia.titulo}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {sugerencia.descripcion}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="caption" color="text.secondary">
                          Días: {sugerencia.frecuencia.diasSemana 
                            ? getDiasSemanaLabel(sugerencia.frecuencia.diasSemana)
                            : `Día ${sugerencia.frecuencia.diaMes || '1'} del mes`}
                        </Typography>
                        <Chip
                          label={`~${sugerencia.totalEstimado} total`}
                          size="small"
                          color={sugerencia.color}
                          variant="outlined"
                        />
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        color={sugerencia.color}
                        startIcon={<CheckCircle />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUsarSugerencia(sugerencia);
                        }}
                      >
                        Usar esta opción
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Configurar después
          </Button>
          <Button
            onClick={() => {
              setOpenRecurringDialog(true);
              setRecurringPreset({
                nombre: '',
                empresaId: target.empresaId,
                empresaNombre: target.empresaNombre,
                sucursalId: target.sucursalId || null,
                sucursalNombre: target.sucursalNombre || null,
                formularioId: formularios?.[0]?.id || '',
                formularioNombre: formularios?.[0]?.nombre || '',
                encargadoId: '',
                frecuencia: {
                  tipo: 'semanal',
                  diasSemana: [],
                  diaMes: null,
                  intervalo: 1
                },
                hora: '09:00',
                fechaInicio: target.mes
                  ? new Date(target.año, target.mes - 1, 1).toISOString().split('T')[0]
                  : new Date(target.año, 0, 1).toISOString().split('T')[0],
                fechaFin: target.mes
                  ? new Date(target.año, target.mes, 0).toISOString().split('T')[0]
                  : null,
                activa: true
              });
            }}
            variant="outlined"
          >
            Configurar manualmente
          </Button>
        </DialogActions>
      </Dialog>

      {openRecurringDialog && (
        <CreateRecurringDialog
          open={openRecurringDialog}
          onClose={handleCloseRecurringDialog}
          onSave={handleSaveRecurring}
          recurringToEdit={recurringPreset ? { ...recurringPreset, id: null } : null}
          empresas={empresas}
          sucursales={sucursales}
          formularios={formularios}
        />
      )}
    </>
  );
};

export default SmartRecurringSuggestions;

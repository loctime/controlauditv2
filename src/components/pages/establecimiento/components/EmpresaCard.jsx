import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Typography,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { getUserDisplayName } from '../../../../utils/userDisplayNames';

const EmpresaCard = React.memo(({
  empresa,
  stats,
  isExpanded,
  onToggleRow,
  formatearEmail,
  ownerEmail = '',
  effectiveOwnerId = null,
  onEditClick,
  onOperariosClick,
  EliminarEmpresaComponent,
  canEditEmpresa = false,
  canDeleteEmpresa = false,
  canManageOperarios = false,
  children
}) => {
  const theme = useTheme();

  const ownerLabel = (() => {
    if (empresa?.propietarioEmail) return formatearEmail(empresa.propietarioEmail);
    if (ownerEmail && effectiveOwnerId && empresa?.ownerId && String(empresa.ownerId) === String(effectiveOwnerId)) {
      return formatearEmail(ownerEmail);
    }
    return 'N/A';
  })();

  const fechaCreacion = empresa.createdAt
    ? new Date(empresa.createdAt.toDate ? empresa.createdAt.toDate() : empresa.createdAt).toLocaleDateString()
    : 'N/A';

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 3,
        boxShadow: isExpanded ? 3 : 1,
        transition: 'box-shadow 0.2s',
        overflow: 'visible'
      }}
    >
      {/* Fila principal siempre visible */}
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 2,
          '&:last-child': { pb: 2 }
        }}
      >
        {/* Avatar / Logo */}
        {empresa.logo && typeof empresa.logo === 'string' && empresa.logo.trim() !== '' ? (
          <img
            src={empresa.logo}
            alt="Logo de la empresa"
            style={{
              width: 44,
              height: 44,
              objectFit: 'contain',
              borderRadius: 8,
              border: '1px solid #eee',
              flexShrink: 0
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Box
            sx={{
              width: 44,
              height: 44,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 700,
              color: theme.palette.primary.main,
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
              flexShrink: 0
            }}
          >
            {empresa.nombre.charAt(0).toUpperCase()}
          </Box>
        )}

        {/* Nombre + propietario + fecha */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
            {empresa.nombre}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {ownerLabel} · {fechaCreacion}
          </Typography>
        </Box>

        {/* Stats resumidas */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <StorefrontIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {stats.sucursales}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {stats.empleados}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ReportProblemIcon
              sx={{
                fontSize: 16,
                color: stats.accidentesAbiertos > 0 ? 'error.main' : 'text.secondary'
              }}
            />
            <Typography
              variant="body2"
              color={stats.accidentesAbiertos > 0 ? 'error.main' : 'text.secondary'}
            >
              {stats.accidentes}
            </Typography>
          </Box>
        </Box>

        {/* Acciones: editar, operarios, eliminar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {canEditEmpresa && (
            <Tooltip title="Editar empresa">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => { e.stopPropagation(); onEditClick(empresa); }}
                aria-label={`Editar empresa ${empresa.nombre}`}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canManageOperarios && onOperariosClick && (
            <Tooltip title={`Gestionar ${getUserDisplayName('default').toLowerCase()}s`}>
              <IconButton
                size="small"
                color="info"
                onClick={(e) => { e.stopPropagation(); onOperariosClick(empresa); }}
                aria-label={`Gestionar operarios de ${empresa.nombre}`}
              >
                <PersonAddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDeleteEmpresa && EliminarEmpresaComponent && (
            <Box onClick={(e) => e.stopPropagation()}>
              <EliminarEmpresaComponent empresa={empresa} onEmpresaEliminada={() => {}} />
            </Box>
          )}

          {/* Flecha expandir */}
          <Tooltip title={isExpanded ? 'Ocultar sucursales' : 'Ver sucursales'}>
            <IconButton
              size="small"
              onClick={() => onToggleRow(empresa.id)}
              aria-label={isExpanded ? `Ocultar detalles de ${empresa.nombre}` : `Mostrar detalles de ${empresa.nombre}`}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>

      {/* Contenido expandido (SucursalesTab) */}
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box
          sx={{
            backgroundColor: 'grey.50',
            borderTop: `1px solid ${theme.palette.divider}`,
            p: 2
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Card>
  );
});

EmpresaCard.displayName = 'EmpresaCard';

export default EmpresaCard;

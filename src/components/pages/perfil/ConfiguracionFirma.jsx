import logger from '@/utils/logger';
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Paper,
  Grid,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';
import Swal from 'sweetalert2';

const capitalizeWords = (str) => {
  return str.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
};

const NativeSignaturePad = React.forwardRef(({ minWidth = 1, backgroundColor = '#ffffff' }, ref) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);
  const strokesRef = useRef([]);
  const currentStroke = useRef([]);

  const redraw = (ctx, strokes) => {
    const canvas = ctx.canvas;
    const ratio = window.devicePixelRatio || 1;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    strokes.forEach(stroke => {
      if (!stroke || stroke.length === 0) return;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = minWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0].x, stroke[0].y, minWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let observer;

    const setupObserver = () => {
      observer = new ResizeObserver(() => {
        const ratio = window.devicePixelRatio || 1;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const data = [...strokesRef.current];
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);
        redraw(ctx, data);
      });
      observer.observe(canvas);
    };

    const initCanvas = () => {
      if (canvas.offsetWidth === 0) return false;
      const ratio = window.devicePixelRatio || 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
      canvas.style.touchAction = 'none';
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      setupObserver();
      return true;
    };

    if (!initCanvas()) {
      const retry = setTimeout(() => { initCanvas(); }, 150);
      return () => { clearTimeout(retry); observer?.disconnect(); };
    }

    return () => observer?.disconnect();
  }, [backgroundColor]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ratio = window.devicePixelRatio || 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width / ratio, canvas.height / ratio);
      strokesRef.current = [];
    },
    isEmpty: () => strokesRef.current.length === 0,
    toData: () => strokesRef.current,
    fromData: (data) => {
      strokesRef.current = data || [];
      const canvas = canvasRef.current;
      if (!canvas) return;
      redraw(canvas.getContext('2d', { willReadFrequently: true }), strokesRef.current);
    },
    getTrimmedCanvas: () => canvasRef.current,
  }));

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getTouchPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const startDraw = (x, y) => {
    isDrawing.current = true;
    lastPoint.current = { x, y };
    currentStroke.current = [{ x, y }];
  };

  const draw = (x, y) => {
    if (!isDrawing.current || !lastPoint.current) return;
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    const prev = lastPoint.current;
    const midX = (prev.x + x) / 2;
    const midY = (prev.y + y) / 2;

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = minWidth + 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPoint.current = { x, y };
    currentStroke.current.push({ x, y });
  };

  const endDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentStroke.current.length > 0) {
      strokesRef.current = [...strokesRef.current, [...currentStroke.current]];
      currentStroke.current = [];
    }
    lastPoint.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '200px', display: 'block', cursor: 'crosshair' }}
      onMouseDown={(e) => { const p = getPos(e); startDraw(p.x, p.y); }}
      onMouseMove={(e) => { const p = getPos(e); draw(p.x, p.y); }}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
      onTouchStart={(e) => { e.preventDefault(); const p = getTouchPos(e); startDraw(p.x, p.y); }}
      onTouchMove={(e) => { e.preventDefault(); const p = getTouchPos(e); draw(p.x, p.y); }}
      onTouchEnd={(e) => { e.preventDefault(); endDraw(); }}
    />
  );
});

const ConfiguracionFirma = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [nombre, setNombre] = useState(userProfile?.nombre || '');
  const [dni, setDni] = useState(userProfile?.dni || '');
  const [telefono, setTelefono] = useState(userProfile?.telefono || '');
  const [isSaving, setIsSaving] = useState(false);

  const sigPadRef = useRef(null);

  useEffect(() => {
    if (userProfile?.firmaDigital) {
      setHasSignature(true);
      setSignatureData(userProfile.firmaDigital);
    }
    if (userProfile?.nombre) {
      setNombre(userProfile.nombre);
    }
    if (userProfile?.dni) {
      setDni(userProfile.dni);
    }
    if (userProfile?.telefono) {
      setTelefono(userProfile.telefono);
    }
  }, [userProfile?.firmaDigital, userProfile?.nombre, userProfile?.dni, userProfile?.telefono]);

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Swal.fire('Error', 'Por favor ingresa tu nombre y apellido', 'error');
      return;
    }
    if (!dni.trim()) {
      Swal.fire('Error', 'Por favor ingresa tu DNI', 'error');
      return;
    }
    if ((!sigPadRef.current || sigPadRef.current.isEmpty()) && !signatureData) {
      Swal.fire('Error', 'Por favor dibuja tu firma antes de guardar', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const signatureDataUrl = sigPadRef.current && !sigPadRef.current.isEmpty()
        ? sigPadRef.current.getTrimmedCanvas().toDataURL('image/png')
        : signatureData;
      const nombreFormateado = capitalizeWords(nombre.trim());
      await updateUserProfile({
        firmaDigital: signatureDataUrl,
        firmaActualizada: new Date().toISOString(),
        nombre: nombreFormateado,
        dni: dni.trim(),
        telefono: telefono.trim()
      });
      setSignatureData(signatureDataUrl);
      setHasSignature(true);
      setIsEditing(false);
      Swal.fire('Éxito', 'Datos y firma guardados correctamente', 'success');
    } catch (error) {
      logger.error('Error al guardar firma:', error);
      Swal.fire('Error', 'Error al guardar los datos', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: '¿Eliminar firma?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
      setIsSaving(true);
      try {
        await updateUserProfile({
          firmaDigital: null,
          firmaActualizada: null
        });
        setSignatureData('');
        setHasSignature(false);
        Swal.fire('Éxito', 'Firma eliminada correctamente', 'success');
      } catch (error) {
        logger.error('Error al eliminar firma:', error);
        Swal.fire('Error', 'Error al eliminar la firma', 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDownload = () => {
    if (!signatureData) return;
    const link = document.createElement('a');
    link.download = `firma_${userProfile?.displayName || 'usuario'}.png`;
    link.href = signatureData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Por favor selecciona un archivo de imagen', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setSignatureData(e.target.result);
      setHasSignature(true);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Configuración de Firma Digital
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Completa tus datos y configura tu firma digital para firmar documentos de forma rápida y segura.
      </Typography>
      <Grid container spacing={3}>
        {/* Vista previa de la firma */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Vista Previa de Firma
              </Typography>
              {hasSignature ? (
                <Box>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: `2px dashed ${theme.palette.divider}`,
                      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
                      minHeight: 150,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}
                  >
                    <img 
                      src={signatureData} 
                      alt="Firma del usuario" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '120px',
                        objectFit: 'contain'
                      }} 
                    />
                    {/* Aclaración de nombre y apellido */}
                    {nombre && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                        {nombre}
                      </Typography>
                    )}
                  </Paper>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditing(true)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownload}
                    >
                      Descargar
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={handleDelete}
                    >
                      Eliminar
                    </Button>
                  </Box>
                  {userProfile?.firmaActualizada && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Última actualización: {new Date(userProfile.firmaActualizada).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Alert severity="info">
                  No tienes una firma configurada. Crea tu primera firma digital.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        {/* Editor de firma y campos de datos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {isEditing || !hasSignature ? 'Completa tus datos y crea tu firma' : 'Editar Firma y Datos'}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <label htmlFor="nombre-input">
                  <Typography variant="body2" color="text.secondary">
                    Nombre y Apellido:
                  </Typography>
                </label>
                <input
                  id="nombre-input"
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    fontSize: 16, 
                    marginBottom: 8, 
                    borderRadius: 4, 
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    color: theme.palette.text.primary
                  }}
                  placeholder="Ingresa tu nombre y apellido"
                  autoComplete="off"
                  required
                />
                <label htmlFor="dni-input">
                  <Typography variant="body2" color="text.secondary">
                    DNI:
                  </Typography>
                </label>
                <input
                  id="dni-input"
                  type="text"
                  value={dni}
                  onChange={e => setDni(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    fontSize: 16, 
                    marginBottom: 8, 
                    borderRadius: 4, 
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    color: theme.palette.text.primary
                  }}
                  placeholder="Ingresa tu DNI"
                  autoComplete="off"
                  required
                />
                <label htmlFor="telefono-input">
                  <Typography variant="body2" color="text.secondary">
                    Teléfono (opcional):
                  </Typography>
                </label>
                <input
                  id="telefono-input"
                  type="text"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    fontSize: 16, 
                    marginBottom: 8, 
                    borderRadius: 4, 
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    color: theme.palette.text.primary
                  }}
                  placeholder="Ingresa tu teléfono"
                  autoComplete="off"
                />
              </Box>
              {(isEditing || !hasSignature) && (
                <Box>
                  <Paper
                    elevation={2}
                    sx={{
                      border: `2px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                      mb: 2
                    }}
                  >
                    <NativeSignaturePad
                      ref={sigPadRef}
                      minWidth={1}
                      backgroundColor={theme.palette.mode === 'dark' ? theme.palette.background.paper : "#ffffff"}
                    />
                  </Paper>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={handleClear}
                    >
                      Limpiar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<UploadIcon />}
                      component="label"
                    >
                      Subir Imagen
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={!nombre || !dni || (!sigPadRef.current?.isEmpty() === false)}
                    >
                      Guardar Firma
                    </Button>
                    {isEditing && (
                      <Button
                        variant="outlined"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Información adicional */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Información sobre Firmas Digitales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Tu firma y datos personales se almacenan de forma segura en tu perfil
            <br />
            • Puedes usar esta firma para firmar documentos con un solo clic
            <br />
            • La firma se puede editar o eliminar en cualquier momento
            <br />
            • Se recomienda usar una firma clara y legible
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ConfiguracionFirma; 
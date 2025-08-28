import React from 'react';
import { Box } from '@mui/material';
import { usePlatform } from '../../hooks/usePlatform.js';
import DownloadAPK from './DownloadAPK.jsx';
import UpdateChecker from './UpdateChecker.jsx';

const SmartAPKDownload = ({ 
  variant = 'contained', 
  size = 'medium', 
  showInfo = false,
  showInAPK = true, // Si mostrar el verificador de actualizaciones en APK
  showInWeb = true  // Si mostrar el botón de descarga en web
}) => {
  const { isAPK, isWeb } = usePlatform();

  // En APK: mostrar verificador de actualizaciones (solo si hay actualización)
  if (isAPK && showInAPK) {
    return <UpdateChecker variant={variant} size={size} showInfo={showInfo} />;
  }

  // En Web: mostrar botón de descarga
  if (isWeb && showInWeb) {
    return <DownloadAPK variant={variant} size={size} showInfo={showInfo} />;
  }

  // No mostrar nada si no cumple las condiciones
  return null;
};

export default SmartAPKDownload;

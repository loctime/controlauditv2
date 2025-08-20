import React from 'react';
import Auditoria from './Auditoria';

// Componente wrapper para auditoría en APK
const AuditoriaAPK = () => {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <Auditoria />
    </div>
  );
};

export default AuditoriaAPK;

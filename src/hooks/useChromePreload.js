import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useChromePreload = () => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  const [preloadProgress, setPreloadProgress] = useState(0);
  const navigate = useNavigate();

  // Detectar si es Chrome
  const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
  
  // Páginas a precargar en orden
  const pagesToPreload = [
    { path: '/auditoria', name: 'Auditoría' },
    { path: '/formulario', name: 'Formularios' },
    { path: '/sucursales', name: 'Sucursales' },
    { path: '/editar', name: 'Editar' },
    { path: '/reporte', name: 'Reportes' }
  ];

  const startPreload = async () => {
    if (!isChrome || isPreloading) return;

    console.log('🚀 [ChromePreload] Iniciando precarga automática para Chrome...');
    setIsPreloading(true);
    setPreloadProgress(0);

    // Mostrar loader de precarga
    const loader = document.createElement('div');
    loader.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          max-width: 400px;
          width: 90%;
        ">
          <div style="
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #1976d2;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          "></div>
          <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">
            Optimizando para Chrome
          </h3>
          <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
            Precargando páginas para mejor rendimiento offline...
          </p>
          <div style="
            width: 100%;
            height: 8px;
            background: #f0f0f0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
          ">
            <div id="progress-bar" style="
              width: 0%;
              height: 100%;
              background: linear-gradient(90deg, #1976d2, #42a5f5);
              transition: width 0.3s ease;
            "></div>
          </div>
          <p id="progress-text" style="margin: 0; color: #1976d2; font-size: 12px; font-weight: 600;">
            Iniciando...
          </p>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loader);

    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    try {
      // Precargar cada página
      for (let i = 0; i < pagesToPreload.length; i++) {
        const page = pagesToPreload[i];
        const progress = ((i + 1) / pagesToPreload.length) * 100;
        
        setCurrentPage(page.name);
        setPreloadProgress(progress);
        
        // Actualizar UI
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `Precargando ${page.name}... (${Math.round(progress)}%)`;
        
        console.log(`🔄 [ChromePreload] Precargando: ${page.name} (${page.path})`);
        
        // Navegar a la página para precargarla
        navigate(page.path);
        
        // Esperar un poco para que la página se cargue completamente
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Volver al home después de precargar todo
      console.log('✅ [ChromePreload] Precarga completada, volviendo al home...');
      navigate('/');
      
      // Actualizar UI final
      if (progressText) progressText.textContent = '¡Precarga completada!';
      
      // Esperar un poco antes de quitar el loader
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error) {
      console.error('❌ [ChromePreload] Error durante la precarga:', error);
      if (progressText) progressText.textContent = 'Error en la precarga';
    } finally {
      // Quitar loader
      if (document.body.contains(loader)) {
        document.body.removeChild(loader);
      }
      setIsPreloading(false);
      setCurrentPage('');
      setPreloadProgress(0);
    }
  };

  return {
    isChrome,
    isPreloading,
    currentPage,
    preloadProgress,
    startPreload
  };
};

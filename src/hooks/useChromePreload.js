import logger from '@/utils/logger';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Debe coincidir con la versión usada por el Service Worker para el cache dinámico.
export const OFFLINE_PRELOAD_CACHE_VERSION = 'v16';
export const useChromePreload = () => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  const [preloadProgress, setPreloadProgress] = useState(0);
  const navigate = useNavigate();
  const hasPreloaded = useRef(false);
  const isPWAStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
  const shouldPreload = isPWAStandalone && isChrome;

  const dynamicCacheName = `controlaudit-dynamic-${OFFLINE_PRELOAD_CACHE_VERSION}`;
  const pagesToPreload = [
    { path: '/establecimiento', name: 'Establecimientos' },
    { path: '/auditoria', name: 'Auditoría' },
    { path: '/editar', name: 'Formularios' },
    { path: '/reporte', name: 'Reportes' },
    { path: '/perfil', name: 'Perfil' },
    // Importante: `/tablero` es lazy-loaded; si no se precarga el chunk,
    // al entrar offline puede quedar pantalla en blanco.
    { path: '/tablero', name: 'Tablero' }
  ];
  // Espera hasta que el cache tenga al menos N chunks JS, o timeout
  const waitForCacheGrowth = async (previousCount, maxWaitMs = 8000) => {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      try {
        const cache = await caches.open(dynamicCacheName);
        const keys = await cache.keys();
        const jsChunks = keys.filter(r => r.url.includes('/assets/') && r.url.endsWith('.js'));
        if (jsChunks.length > previousCount) return jsChunks.length;
      } catch (e) {
        // ignorar
      }
      await new Promise(r => setTimeout(r, 300));
    }
    return previousCount;
  };
  const startPreload = async () => {
    const hasPreloadedThisSession = sessionStorage.getItem('chrome_preload_done') === 'true';
    if (!shouldPreload || isPreloading || hasPreloaded.current || hasPreloadedThisSession) return;
    hasPreloaded.current = true;
    sessionStorage.setItem('chrome_preload_done', 'true');
    setIsPreloading(true);
    setPreloadProgress(0);
    const loader = document.createElement('div');
    loader.id = 'preload-overlay';
    loader.innerHTML = `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center;z-index:10000;font-family:Arial,sans-serif;">
        <div style="background:white;padding:40px;border-radius:15px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.3);max-width:400px;width:90%;">
          <div style="width:50px;height:50px;border:4px solid #f3f3f3;border-top:4px solid #1976d2;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px;"></div>
          <h3 style="margin:0 0 10px 0;color:#333;font-size:18px;">Preparando modo offline</h3>
          <p style="margin:0 0 20px 0;color:#666;font-size:14px;">Descargando páginas para uso sin conexión...</p>
          <div style="width:100%;height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;margin-bottom:10px;">
            <div id="preload-progress-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#1976d2,#42a5f5);transition:width 0.3s ease;"></div>
          </div>
          <p id="preload-progress-text" style="margin:0;color:#1976d2;font-size:12px;font-weight:600;">Iniciando...</p>
        </div>
      </div>
      <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(loader);
    const progressBar = document.getElementById('preload-progress-bar');
    const progressText = document.getElementById('preload-progress-text');
    try {
      // Contar chunks antes de empezar
      let previousChunkCount = 0;
      try {
        const cache = await caches.open(dynamicCacheName);
        const keys = await cache.keys();
        previousChunkCount = keys.filter(r => r.url.includes('/assets/') && r.url.endsWith('.js')).length;
      } catch(e) {}
      for (let i = 0; i < pagesToPreload.length; i++) {
        const page = pagesToPreload[i];
        const progress = ((i + 1) / pagesToPreload.length) * 100;
        setCurrentPage(page.name);
        setPreloadProgress(progress);
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `Cargando ${page.name}...`;
        navigate(page.path);
        // Esperar hasta que el cache crezca (chunk nuevo) o timeout de 8s
        previousChunkCount = await waitForCacheGrowth(previousChunkCount, 8000);
        // Pausa mínima para que el componente termine de montar
        await new Promise(r => setTimeout(r, 500));
      }
      navigate('/');
      if (progressText) progressText.textContent = '¡Listo para usar sin conexión!';
      localStorage.setItem('chrome_preload_timestamp', Date.now().toString());
      localStorage.setItem('chrome_preload_cache_version', OFFLINE_PRELOAD_CACHE_VERSION);
      await new Promise(r => setTimeout(r, 1500));
    } catch (error) {
      logger.error('Error durante preload:', error);
    } finally {
      const overlay = document.getElementById('preload-overlay');
      if (overlay && document.body.contains(overlay)) document.body.removeChild(overlay);
      setIsPreloading(false);
      setCurrentPage('');
      setPreloadProgress(0);
    }
  };
  return { shouldPreload, isPreloading, currentPage, preloadProgress, startPreload };
};

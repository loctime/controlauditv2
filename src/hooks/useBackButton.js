import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { appUtils, capacitorUtils } from '../utils/capacitorOptimization';

/**
 * Hook personalizado para manejar el botón atrás de Android
 * Muestra un diálogo de confirmación antes de cerrar la aplicación
 */
export const useBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let backButtonListener = null;

    const setupBackButtonListener = async () => {
      try {
        // Verificar si estamos en una plataforma nativa
        const isNative = await capacitorUtils.isNative();
        const isAndroid = await capacitorUtils.isAndroid();

        if (!isNative || !isAndroid) {
          return; // Solo funciona en Android nativo
        }

        // Importar App de Capacitor
        const { App } = await import('@capacitor/app');

        // Función para mostrar diálogo de confirmación
        const showExitConfirmation = () => {
          return new Promise((resolve) => {
            // Crear diálogo nativo de Android
            const dialog = document.createElement('div');
            dialog.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 9999;
            `;

            const dialogContent = document.createElement('div');
            dialogContent.style.cssText = `
              background: white;
              padding: 24px;
              border-radius: 8px;
              max-width: 300px;
              width: 90%;
              text-align: center;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            `;

            dialogContent.innerHTML = `
              <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">
                ¿Desea salir?
              </h3>
              <p style="margin: 0 0 24px 0; color: #666; font-size: 14px;">
                Presione "Salir" para cerrar la aplicación
              </p>
              <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="cancel-btn" style="
                  background: #f5f5f5;
                  border: 1px solid #ddd;
                  padding: 10px 20px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                  color: #333;
                ">Cancelar</button>
                <button id="exit-btn" style="
                  background: #d32f2f;
                  border: 1px solid #d32f2f;
                  padding: 10px 20px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                  color: white;
                ">Salir</button>
              </div>
            `;

            dialog.appendChild(dialogContent);
            document.body.appendChild(dialog);

            // Event listeners para los botones
            const cancelBtn = dialogContent.querySelector('#cancel-btn');
            const exitBtn = dialogContent.querySelector('#exit-btn');

            const cleanup = () => {
              document.body.removeChild(dialog);
            };

            cancelBtn.addEventListener('click', () => {
              cleanup();
              resolve(false);
            });

            exitBtn.addEventListener('click', () => {
              cleanup();
              resolve(true);
            });

            // Cerrar al hacer clic fuera del diálogo
            dialog.addEventListener('click', (e) => {
              if (e.target === dialog) {
                cleanup();
                resolve(false);
              }
            });
          });
        };

        // Manejar el botón atrás
        const handleBackButton = async () => {
          // Si estamos en la página principal, mostrar confirmación
          if (location.pathname === '/' || location.pathname === '/home') {
            const shouldExit = await showExitConfirmation();
            if (shouldExit) {
              await appUtils.exitApp();
            }
            return;
          }

          // Si no estamos en la página principal, navegar hacia atrás
          navigate(-1);
        };

        // Agregar listener para el botón atrás
        backButtonListener = await App.addListener('backButton', handleBackButton);

      } catch (error) {
        console.error('Error al configurar el botón atrás:', error);
      }
    };

    // Configurar el listener
    setupBackButtonListener();

    // Cleanup
    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [navigate, location.pathname]);

  return null; // Este hook no retorna nada, solo maneja el evento
};

import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./global.css";
import { initOfflineDatabase } from "./services/offlineDatabase";

// Inicializar base de datos offline con retry.
const initDatabaseWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await initOfflineDatabase();
      console.log('✅ Base de datos offline inicializada correctamente');
      return;
    } catch (error) {
      console.error(`❌ Error al inicializar base de datos offline (intento ${i + 1}/${retries}):`, error);
      if (i === retries - 1) {
        console.error('❌ Falló la inicialización de la base de datos offline después de todos los intentos');
        // Continuar sin la base de datos offline
      } else {
        // Esperar un poco antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
};

initDatabaseWithRetry();

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

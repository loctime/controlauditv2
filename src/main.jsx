import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./global.css";
import { initOfflineDatabase } from "./services/offlineDatabase";

// Inicializar base de datos offline
initOfflineDatabase()
  .then(() => {
    console.log('✅ Base de datos offline inicializada correctamente');
  })
  .catch((error) => {
    console.error('❌ Error al inicializar base de datos offline:', error);
  });

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./global.css";
import "./zoom-support.css";
import "./styles/apk-centering-fix.css";
import "./styles/apk-viewport-fix.css";
import "./styles/apk-margin-fix.css";
import './utils/debug-env.js';
// import { initializeGoogleAuth } from './utils/googleAuthNative';

// Inicializar Google Auth nativo - TEMPORALMENTE DESHABILITADO
// initializeGoogleAuth();

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

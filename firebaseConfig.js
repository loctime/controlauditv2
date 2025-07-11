import { initializeApp } from "firebase/app";
import {
  signInWithEmailAndPassword,
  getAuth,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Importa getStorage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD7pmD_EVRf0dJcocynpaXAdu3tveycrzg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "auditoria-f9fc4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "auditoria-f9fc4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "auditoria-f9fc4.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "156800340171",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:156800340171:web:fbe017105fd68b0f114b4e"
}; 
// src/services/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// REEMPLAZA ESTO CON TUS CLAVES DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAK5d8DlgueRLGgx4-HQhUfzALCV1uAccU",
  authDomain: "outstanding-web.firebaseapp.com",
  projectId: "outstanding-web",
  storageBucket: "outstanding-web.firebasestorage.app",
  messagingSenderId: "967112405844",
  appId: "1:967112405844:web:060ded8f500684f5e08ec1",
  measurementId: "G-EL0EHEGFQW"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar los servicios para usarlos en toda la app
export const auth = getAuth(app);
export const db = getFirestore(app);
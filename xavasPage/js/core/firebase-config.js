// Importa o núcleo do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// Importa Autenticação
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// Importa Banco de Dados (Firestore)
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// COLE SUAS CHAVES AQUI (geradas no Passo 5 da Fase 1)
const firebaseConfig = {
    apiKey: "AIzaSyA0yg7FTOKKsWUbpuGCspTp3h6ntOSbEf0",
    authDomain: "xvs-hub-db.firebaseapp.com",
    projectId: "xvs-hub-db",
    storageBucket: "xvs-hub-db.firebasestorage.app",
    messagingSenderId: "204350459999",
    appId: "1:204350459999:web:aea07419d830560e588bea"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta as funções para serem usadas nas outras páginas
export { auth, db, signInWithEmailAndPassword, onAuthStateChanged, signOut, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot };
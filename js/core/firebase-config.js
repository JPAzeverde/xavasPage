// Importa o núcleo do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// Importa Autenticação
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// Importa Banco de Dados (Firestore)
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// COLE SUAS CHAVES AQUI (geradas no Passo 5 da Fase 1)
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ":"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta as funções para serem usadas nas outras páginas
export { auth, db, signInWithEmailAndPassword, onAuthStateChanged, signOut, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot };
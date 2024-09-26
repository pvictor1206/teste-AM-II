const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject  } = require('firebase/storage'); // Inclui Firebase Storage



const firebaseConfig = {
  apiKey: "AIzaSyCuDd0D1C1v5O3DbGFHkJZFj3gHODVe2sw",
  authDomain: "am-ii-ww-loja.firebaseapp.com",
  projectId: "am-ii-ww-loja",
  storageBucket: "am-ii-ww-loja.appspot.com",
  messagingSenderId: "945142150417",
  appId: "1:945142150417:web:463dd0235c2b7b0fa488b0",
  measurementId: "G-DFDK8C3M5X"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o serviço de autenticação
const auth = getAuth(app);

// Inicializa o Firestore
const db = getFirestore(app);

// Inicializa o Storage
const storage = getStorage(app); // Inicializa Firebase Storage

module.exports = { auth, signInWithEmailAndPassword, db, storage, ref, uploadBytes, getDownloadURL, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, deleteObject  };
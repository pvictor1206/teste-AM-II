const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth'); // Importe o método signInWithEmailAndPassword

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

module.exports = { auth, signInWithEmailAndPassword }; // Exporte o signInWithEmailAndPassword também

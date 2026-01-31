const firebaseConfig = {
  apiKey: "AIzaSyCVS4BoTkwG9vKtX-JX9BCh36rPIFTaFf8",
  authDomain: "we-dump-v2-d6211.firebaseapp.com",
  projectId: "we-dump-v2-d6211",
  storageBucket: "we-dump-v2-d6211.firebasestorage.app",
  messagingSenderId: "669346692378",
  appId: "1:669346692378:web:7a1b9c5eefa84ae4bb00a3",
  measurementId: "G-9Z14PNSHS8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Services
window.firebaseAuth = firebase.auth();
window.firebaseDb = firebase.firestore();
window.firebaseStorage = firebase.storage();

// Google Provider
window.googleProvider = new firebase.auth.GoogleAuthProvider();
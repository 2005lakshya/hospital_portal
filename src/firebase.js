import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA3KaRX-hrsLK1kQKCL0rdmK8GkgY_rKIk",
    authDomain: "hospital-ebf99.firebaseapp.com",
    projectId: "hospital-ebf99",
    storageBucket: "hospital-ebf99.firebasestorage.app",
    messagingSenderId: "209471342928",
    appId: "1:209471342928:web:f23142e3531c1315048455",
    measurementId: "G-ZR7T6XG6R7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Authentication setup
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Firestore Database Setup
const db = getFirestore(app);

export { auth, provider, signInWithPopup, db };

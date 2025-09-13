
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "studio-6400668306-1ec3d",
  appId: "1:102278776623:web:f5ab4dfc93414adacc83da",
  storageBucket: "studio-6400668306-1ec3d.firebasestorage.app",
  apiKey: "AIzaSyB8wCLmaicWGB-QzaIDJ2zsi0DQuX5Jp7g",
  authDomain: "studio-6400668306-1ec3d.firebaseapp.com",
  messagingSenderId: "102278776623",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { app, db };

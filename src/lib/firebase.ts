// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import admin from 'firebase-admin';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "studio-6400668306-1ec3d",
  appId: "1:102278776623:web:f5ab4dfc93414adacc83da",
  storageBucket: "studio-6400668306-1ec3d.firebasestorage.app",
  apiKey: "AIzaSyB8wCLmaicWGB-QzaIDJ2zsi0DQuX5Jp7g",
  authDomain: "studio-6400668306-1ec3d.firebaseapp.com",
  messagingSenderId: "102278776623",
};

// Initialize Firebase client app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
const auth = getAuth(app);


// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export { app, db, auth, admin };

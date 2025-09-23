// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "studio-4951261326-59af4",
  "appId": "1:1052737699941:web:8c754530fa0089ac38c68c",
  "storageBucket": "studio-4951261326-59af4.firebasestorage.app",
  "apiKey": "AIzaSyCk4_70Qgb6SLFQ4xjec7DaL11mnD42mWo",
  "authDomain": "daper-mind--studio-4951261326-59af4.asia-east1.hosted.app",
  "measurementId": "",
  "messagingSenderId": "1052737699941"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

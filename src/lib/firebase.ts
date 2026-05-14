import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5DfCV1eraS9h7dEXEyAmi-6AncW1j-WY",
  authDomain: "device-streaming-468e1c36.firebaseapp.com",
  projectId: "device-streaming-468e1c36",
  storageBucket: "device-streaming-468e1c36.firebasestorage.app",
  messagingSenderId: "911398981368",
  appId: "1:911398981368:web:f365cc857454b926d0f50d",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
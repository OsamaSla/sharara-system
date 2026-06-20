import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBfdAor41JgT_PFK0PO9vGDuG96cCPW5PU",
  authDomain: "sharara-system.firebaseapp.com",
  projectId: "sharara-system",
  storageBucket: "sharara-system.firebasestorage.app",
  messagingSenderId: "397442355532",
  appId: "1:397442355532:web:388a794dd78681e050bfe9",
  measurementId: "G-7MENMK08B4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

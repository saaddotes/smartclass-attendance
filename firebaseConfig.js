import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCs_pix5_BOQRWXAFVE8IZ5syG8ZcpYcAg",
  authDomain: "practice-fire-38369.firebaseapp.com",
  projectId: "practice-fire-38369",
  storageBucket: "practice-fire-38369.firebasestorage.app",
  messagingSenderId: "932154808874",
  appId: "1:932154808874:web:9e1d4b81986bc47d380153",
};

const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);

const db = getFirestore(app);

// Initialize Firebase Auth with React Native Persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app, db, auth };

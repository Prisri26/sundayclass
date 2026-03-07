import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore - Firebase v12 TS definitions for React Native are temporarily missing this export, but the runtime bundle has it
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ⚠️ Replace these with your own Firebase project credentials
// Get them from: https://console.firebase.google.com → Project Settings → Your Apps
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_PROJECT_ID.appspot.com",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID",
// };

const firebaseConfig = {
  apiKey: "AIzaSyD7mSfLP0sHEylUCK5c3AM_Ab7k1nFA7uY",
  authDomain: "sunday-school-attendance-8e42b.firebaseapp.com",
  projectId: "sunday-school-attendance-8e42b",
  storageBucket: "sunday-school-attendance-8e42b.firebasestorage.app",
  messagingSenderId: "709717855581",
  appId: "1:709717855581:web:94036cfbe694a5a1c16cb4",
  measurementId: "G-5GH9H3JZ90"
};


// Guard against double initialization (e.g. hot reload in dev)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize auth with explicit AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore - Firebase v12 TS definitions for React Native are temporarily missing this export, but the runtime bundle has it
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[mobile/firebase] Missing required env var: ${name}. ` +
      `Create mobile/.env from mobile/.env.example and restart the app.`,
    );
  }
  return value;
}

const firebaseConfig = {
  apiKey: requireEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: requireEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};


// Guard against double initialization (e.g. hot reload in dev)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Reuse existing auth on reloads; initialize only once with AsyncStorage persistence.
export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch {
    return getAuth(app);
  }
})();
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

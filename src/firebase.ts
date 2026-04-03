
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfigFile from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || firebaseConfigFile.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfigFile.authDomain,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfigFile.projectId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || firebaseConfigFile.appId,
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || firebaseConfigFile.firestoreDatabaseId
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
// Use the named database if provided, otherwise default to '(default)'
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);

// Validate connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}
testConnection();

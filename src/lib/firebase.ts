import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const hasFirebaseConfig = Boolean(
  firebaseConfig &&
    typeof firebaseConfig === 'object' &&
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const fallbackAuth = {
  currentUser: null,
  onAuthStateChanged: () => () => undefined,
} as unknown as Auth;

export const app = hasFirebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : undefined;

export const auth: Auth = hasFirebaseConfig && app ? getAuth(app) : fallbackAuth;

export const firestore = hasFirebaseConfig && app
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)')
  : null;

export async function createUserWithEmailAndPassword(authInstance: Auth, email: string, password: string) {
  if (!hasFirebaseConfig || !authInstance || !authInstance.currentUser) {
    throw new Error('Firebase is not configured. Add firebase-applet-config.json to enable cloud auth.');
  }
  return firebaseCreateUserWithEmailAndPassword(authInstance, email, password);
}

export async function signInWithEmailAndPassword(authInstance: Auth, email: string, password: string) {
  if (!hasFirebaseConfig || !authInstance) {
    throw new Error('Firebase is not configured. Add firebase-applet-config.json to enable cloud auth.');
  }
  return firebaseSignInWithEmailAndPassword(authInstance, email, password);
}

export async function signOut(authInstance: Auth | null | undefined) {
  if (!hasFirebaseConfig || !authInstance) {
    return;
  }
  return firebaseSignOut(authInstance);
}

export function onAuthStateChanged(authInstance: Auth | null | undefined, callback: (user: User | null) => void) {
  if (!hasFirebaseConfig || !authInstance) {
    callback(null);
    return () => undefined;
  }
  return firebaseOnAuthStateChanged(authInstance, callback);
}

export async function testFirestoreConnection(): Promise<boolean> {
  if (!hasFirebaseConfig || !firestore) {
    return false;
  }

  try {
    await getDocFromServer(doc(firestore, 'test', 'ping'));
    return true;
  } catch (err: any) {
    if (err?.message?.includes('the client is offline')) {
      console.warn('[Firebase] Device appears offline; Firestore local queue will be used.');
      return false;
    }
    // Permission denied on non-existent test doc is expected and indicates successful server handshake
    return true;
  }
}

export type { User };

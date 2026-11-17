import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth as firebaseGetAuth,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signInWithPopup as firebaseSignInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type Auth,
  type AuthProvider,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
);

export const app = hasFirebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth: Auth | null = app ? firebaseGetAuth(app) : null;
const configuredDbId = (firebaseConfig as Record<string, unknown>).firestoreDatabaseId;
export const firestore: Firestore | null = app
  ? getFirestore(app, typeof configuredDbId === 'string' && configuredDbId ? configuredDbId : '(default)')
  : null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initial connectivity handshake check
export async function testFirestoreConnection(): Promise<boolean> {
  if (!firestore) return false;
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
    return true;
  } catch (err: any) {
    if (err?.message?.includes('the client is offline')) {
      console.warn('[Firebase] Device appears offline; Firestore local queue will be used.');
      return false;
    }
    return true;
  }
}

if (typeof window !== 'undefined') {
  testFirestoreConnection().catch(() => {});
}

function requireAuth(authInstance: Auth | null): Auth {
  if (!authInstance) {
    throw new Error('Firebase is not configured. Populate firebase-applet-config.json first.');
  }
  return authInstance;
}

export function createUserWithEmailAndPassword(
  authInstance: Auth | null,
  email: string,
  password: string
) {
  return firebaseCreateUserWithEmailAndPassword(requireAuth(authInstance), email, password);
}

export function signInWithEmailAndPassword(
  authInstance: Auth | null,
  email: string,
  password: string
) {
  return firebaseSignInWithEmailAndPassword(requireAuth(authInstance), email, password);
}

export function sendPasswordResetEmail(authInstance: Auth | null, email: string) {
  return firebaseSendPasswordResetEmail(requireAuth(authInstance), email);
}

export function signInWithPopup(authInstance: Auth | null, provider: AuthProvider) {
  return firebaseSignInWithPopup(requireAuth(authInstance), provider);
}

export function signOut(authInstance: Auth | null) {
  return authInstance ? firebaseSignOut(authInstance) : Promise.resolve();
}

export function onAuthStateChanged(
  authInstance: Auth | null,
  next: (user: User | null) => void
): Unsubscribe {
  if (!authInstance) {
    next(null);
    return () => {};
  }
  return firebaseOnAuthStateChanged(authInstance, next);
}

export {
  GoogleAuthProvider,
  type User,
};

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { firebaseConfig, isFirebaseConfigured, missingFirebaseVars } from './firebaseConfig'

/**
 * The single Firebase entry point. Never call initializeApp anywhere else —
 * a second init throws at runtime and silently breaks auth state.
 *
 * IMPORTANT: importing this module pulls in the Firebase SDK. Only reach it
 * from lazily loaded admin code (AdminGate, firestoreAdapter). To merely ask
 * whether Firebase is configured, import `firebaseConfig.ts` instead, which
 * has no SDK dependency.
 */
export { isFirebaseConfigured, missingFirebaseVars }

let app: FirebaseApp | null = null

/** Idempotent: reuses the existing app rather than initializing twice. */
export const getFirebaseApp = (): FirebaseApp => {
  if (!isFirebaseConfigured()) {
    throw new Error(`Firebase is not configured. Missing: ${missingFirebaseVars().join(', ')}`)
  }
  if (!app) app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  return app
}

export const getFirebaseAuth = (): Auth => getAuth(getFirebaseApp())
export const getDb = (): Firestore => getFirestore(getFirebaseApp())
export const getFirebaseStorage = (): FirebaseStorage => getStorage(getFirebaseApp())

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { FIRESTORE_SETTINGS, firebaseConfig, isFirebaseConfigured, missingFirebaseVars } from './firebaseConfig'

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
let db: Firestore | null = null

/**
 * `initializeFirestore`, not `getFirestore`: only the former takes settings,
 * and it may run once per app. The fallback covers a dev-server module reload,
 * where this file re-evaluates against an app whose Firestore was already
 * initialised — with these same settings, on the first evaluation.
 */
export const getDb = (): Firestore => {
  if (!db) {
    const firebaseApp = getFirebaseApp()
    try {
      db = initializeFirestore(firebaseApp, FIRESTORE_SETTINGS)
    } catch {
      db = getFirestore(firebaseApp)
    }
  }
  return db
}
export const getFirebaseStorage = (): FirebaseStorage => getStorage(getFirebaseApp())

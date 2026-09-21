/**
 * Firebase configuration, read from VITE_FIREBASE_* env vars.
 *
 * This module deliberately imports NOTHING from the firebase SDK, so that
 * checking "is Firebase set up?" costs nothing at bundle level. Anything that
 * touches the SDK lives in `firebase.ts`, which is only reached from lazily
 * loaded admin code — otherwise the ~570 KB SDK lands on the public sellpage.
 *
 * Note: a Firebase web config is NOT a secret — it ships in the client bundle
 * by design. Access is controlled by firestore.rules / storage.rules, not by
 * hiding these values. An Admin SDK service-account key is a different thing
 * entirely and must never appear here.
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const REQUIRED = ['apiKey', 'authDomain', 'projectId', 'appId'] as const

export const isFirebaseConfigured = (): boolean =>
  REQUIRED.every((k) => typeof firebaseConfig[k] === 'string' && firebaseConfig[k] !== '')

/** Which required vars are missing — for a clear startup message. */
export const missingFirebaseVars = (): string[] =>
  REQUIRED.filter((k) => !firebaseConfig[k]).map((k) => `VITE_FIREBASE_${k.replace(/[A-Z]/g, (c) => '_' + c).toUpperCase()}`)

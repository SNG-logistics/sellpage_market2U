// Imports the SDK-free config module on purpose: this runs at startup on
// every route, including the public sellpage.
import { isFirebaseConfigured, missingFirebaseVars } from '../../../lib/firebaseConfig'
import { setSellpageStorageAdapter } from './sellpageService'

/**
 * Chooses the storage backend once, at startup.
 *
 * With Firebase configured the service layer talks to Firestore; without it
 * the localStorage adapter stays in place so the app runs with no Firebase
 * project at all. Called from main.tsx before the first render.
 */
export async function initSellpageStorage(): Promise<'firestore' | 'local'> {
  if (!isFirebaseConfigured()) {
    console.info(`[sellpage] Local mode — using localStorage. Missing: ${missingFirebaseVars().join(', ')}`)
    return 'local'
  }

  // Dynamic import keeps the Firebase SDK out of the entry bundle; it is only
  // fetched when a project is actually configured.
  const { firestoreAdapter } = await import('./firestoreAdapter')
  setSellpageStorageAdapter(firestoreAdapter)
  return 'firestore'
}

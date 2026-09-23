import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * These read `import.meta.env` at module load, so each case stubs the vars
 * and re-imports rather than calling the already-evaluated module.
 */
const load = async (env: Record<string, string>) => {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return import('./firebaseConfig')
}

const FULL = {
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'p.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'p',
  VITE_FIREBASE_APP_ID: '1:2:web:3',
  VITE_FIREBASE_STORAGE_BUCKET: 'p.firebasestorage.app',
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('isStorageConfigured', () => {
  it('is true only when a bucket is named as well', async () => {
    const { isFirebaseConfigured, isStorageConfigured } = await load(FULL)

    expect(isFirebaseConfigured()).toBe(true)
    expect(isStorageConfigured()).toBe(true)
  })

  it('is false for a project with no bucket, while Firebase itself stays configured', async () => {
    // The Spark plan case: Auth and Firestore work, Cloud Storage needs
    // Blaze. Conflating the two put an upload button in front of users that
    // could only ever fail.
    const { isFirebaseConfigured, isStorageConfigured } = await load({ ...FULL, VITE_FIREBASE_STORAGE_BUCKET: '' })

    expect(isFirebaseConfigured()).toBe(true)
    expect(isStorageConfigured()).toBe(false)
  })

  it('is false with no Firebase project at all', async () => {
    const { isStorageConfigured } = await load({ ...FULL, VITE_FIREBASE_API_KEY: '', VITE_FIREBASE_STORAGE_BUCKET: '' })

    expect(isStorageConfigured()).toBe(false)
  })
})

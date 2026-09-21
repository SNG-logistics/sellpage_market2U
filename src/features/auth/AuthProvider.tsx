import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from '../../lib/firebase'
import { AuthContext, type AuthState } from './authContext'

/**
 * Admin status comes from a custom claim on the ID token — set server-side
 * with the Admin SDK, never from a client-writable field. The same claim is
 * what firestore.rules checks, so the UI and the database cannot disagree.
 */
const readAdminClaim = async (user: User): Promise<boolean> => {
  try {
    const token = await user.getIdTokenResult()
    return token.claims.admin === true
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured()
  const [user, setUser] = useState<User | null | undefined>(configured ? undefined : null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!configured) return
    return onAuthStateChanged(getFirebaseAuth(), async (next) => {
      setUser(next)
      setIsAdmin(next ? await readAdminClaim(next) : false)
    })
  }, [configured])

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAdmin,
      configured,
      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider()
        // Always show the chooser: admins often have several Google accounts
        // and silent reuse of the wrong one is confusing to recover from.
        provider.setCustomParameters({ prompt: 'select_account' })
        await signInWithPopup(getFirebaseAuth(), provider)
      },
      signInWithEmail: async (email, password) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
      },
      signOutUser: async () => {
        await signOut(getFirebaseAuth())
      },
    }),
    [user, isAdmin, configured],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

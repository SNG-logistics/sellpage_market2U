import { createContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthState = {
  /** null = signed out; undefined = still resolving. */
  user: User | null | undefined
  /** True once the admin custom claim has been verified on the ID token. */
  isAdmin: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
}

// Kept out of AuthProvider.tsx so that file exports components only
// (oxlint react/only-export-components — needed for fast refresh).
export const AuthContext = createContext<AuthState | null>(null)

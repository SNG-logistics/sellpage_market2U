import { useState, type ReactNode } from 'react'
import { useAuth } from './useAuth'

/**
 * Gate for /admin/*.
 *
 * This is a UX gate, not the security boundary — a determined visitor can
 * bypass any client-side check. What actually protects the data is
 * firestore.rules requiring `request.auth.token.admin == true` on every write.
 * Both read the same custom claim, so they cannot drift apart.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, configured, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // No Firebase project wired up: local development mode. The localStorage
  // adapter is in use and there is no real data to protect.
  if (!configured) {
    return (
      <>
        <div className="sp-dev-banner" role="status">
          Local mode — Firebase is not configured, so admin pages are unprotected and data is stored in this browser only.
        </div>
        {children}
      </>
    )
  }

  if (user === undefined) return <p style={{ padding: 24 }}>Checking sign-in…</p>

  if (user === null) {
    const onSubmit = async (event: React.FormEvent) => {
      event.preventDefault()
      setError(null)
      setBusy(true)
      try {
        await signIn(email, password)
      } catch {
        // Deliberately vague: don't reveal whether the address has an account.
        setError('Sign-in failed. Check your email and password.')
      } finally {
        setBusy(false)
      }
    }

    return (
      <div className="sp-signin">
        <form onSubmit={onSubmit} className="sp-signin__card">
          <h1>Sign in</h1>
          <label htmlFor="sp-email">Email</label>
          <input id="sp-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label htmlFor="sp-password">Password</label>
          <input
            id="sp-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? (
            <p className="sp-signin__error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 20 }}>Not authorised</h1>
        <p style={{ color: '#6b6a63' }}>This account does not have admin access to the sellpage builder.</p>
      </div>
    )
  }

  return <>{children}</>
}

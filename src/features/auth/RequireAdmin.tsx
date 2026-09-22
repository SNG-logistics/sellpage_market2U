import { useState, type ReactNode } from 'react'
import { useAuth } from './useAuth'

/** Google's mark, inline so the sign-in button needs no network fetch. */
const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
    />
    <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
    <path
      fill="#EA4335"
      d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
    />
  </svg>
)

/**
 * Firebase reports a misconfigured project as an error code and nothing else,
 * so an admin reading "sign-in failed" has nothing to act on. Each code a
 * setup mistake actually produces gets the step that clears it, and anything
 * unrecognised still shows its code rather than swallowing it.
 *
 * The email/password codes stay deliberately vague: which half was wrong, and
 * whether the address has an account at all, are not things to confirm to
 * whoever is typing.
 */
const authErrorHelp = (code: string): string | undefined => {
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this Firebase project. Enable it in Authentication → Sign-in method.'
    case 'auth/configuration-not-found':
      return 'This project has no Authentication set up yet. Open Authentication in the Firebase console and enable a sign-in provider.'
    case 'auth/unauthorized-domain':
      return `${window.location.hostname} is not listed under Authentication → Settings → Authorized domains.`
    case 'auth/popup-blocked':
      return 'The browser blocked the sign-in popup. Allow popups for this site, then try again.'
    case 'auth/network-request-failed':
      return 'The browser could not reach Firebase. Check the connection, and any VPN or content blocker.'
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      return 'VITE_FIREBASE_API_KEY in .env.local is not valid for this project. Copy it again from Project settings → General.'
    case 'auth/internal-error':
      return 'Firebase rejected the request. Usually the Identity Toolkit API is disabled for the project, or the API key has referrer restrictions that exclude this address.'
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Sign-in failed. Check the email and password.'
    default:
      return undefined
  }
}

const describeAuthError = (err: unknown, fallback: string): string | null => {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : ''
  // Closing the popup is a decision, not a failure.
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return null
  return authErrorHelp(code) ?? (code ? `${fallback} (${code})` : fallback)
}

/**
 * Gate for /admin/*.
 *
 * This is a UX gate, not the security boundary — a determined visitor can
 * bypass any client-side check. What actually protects the data is
 * firestore.rules requiring `request.auth.token.admin == true` on every write.
 * Both read the same custom claim, so they cannot drift apart.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, configured, signInWithGoogle, signInWithEmail } = useAuth()
  const [showEmail, setShowEmail] = useState(false)
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
    const run = async (fn: () => Promise<void>, onFail: string) => {
      setError(null)
      setBusy(true)
      try {
        await fn()
      } catch (err) {
        // Keep the original on the console: the message below is a summary,
        // and a stack is what you want when the summary is not enough.
        console.error('[auth] sign-in failed', err)
        setError(describeAuthError(err, onFail))
      } finally {
        setBusy(false)
      }
    }

    return (
      <div className="sp-signin">
        <div className="sp-signin__card">
          <h1>Sign in</h1>
          <p className="sp-signin__sub">Admin access to the Market2U sellpage builder.</p>

          <button
            type="button"
            className="sp-signin__google"
            disabled={busy}
            onClick={() => run(signInWithGoogle, 'Google sign-in failed. Please try again.')}
          >
            <GoogleMark />
            {busy ? 'Signing in…' : 'Sign in with Google'}
          </button>

          {error ? (
            <p className="sp-signin__error" role="alert">
              {error}
            </p>
          ) : null}

          {showEmail ? (
            <form
              className="sp-signin__email"
              onSubmit={(e) => {
                e.preventDefault()
                // Deliberately vague: don't reveal whether the address has an account.
                run(() => signInWithEmail(email, password), 'Sign-in failed. Check your email and password.')
              }}
            >
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
              <button type="submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in with email'}
              </button>
            </form>
          ) : (
            <button type="button" className="sp-signin__alt" onClick={() => setShowEmail(true)}>
              Use email and password instead
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="sp-signin">
        <div className="sp-signin__card">
          <h1>Not authorised</h1>
          <p className="sp-signin__sub">
            Signed in as {user.email ?? 'this account'}, but it does not have admin access to the sellpage builder.
          </p>
          <p className="sp-signin__sub">
            An existing admin needs to grant the <code>admin</code> claim to this account.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

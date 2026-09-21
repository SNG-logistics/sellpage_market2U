import { Outlet } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'
import { RequireAdmin } from './RequireAdmin'

/**
 * Layout route for /admin/*. One AuthProvider wraps every admin page, so
 * auth state is resolved once rather than per navigation.
 *
 * This module is the ONLY thing that pulls in firebase/auth, and App.tsx
 * loads it lazily — that keeps the Firebase SDK (~570 KB) off the public
 * sellpage, which never signs anyone in. See docs/sellpage/ARCHITECTURE.md.
 */
export default function AdminGate() {
  return (
    <AuthProvider>
      <RequireAdmin>
        <Outlet />
      </RequireAdmin>
    </AuthProvider>
  )
}

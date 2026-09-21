import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PublicSellpagePage } from './pages/public/PublicSellpagePage'

// Everything admin-side is lazy so the PUBLIC sellpage ships none of it:
// - AdminGate is the only module importing firebase/auth (~570 KB)
// - the editor page is the only module importing the Puck EDITOR bundle
// The public route below carries just the renderer. See ARCHITECTURE.md.
const AdminGate = lazy(() => import('./features/auth/AdminGate'))
const AdminSellpageListPage = lazy(() =>
  import('./pages/admin/AdminSellpageListPage').then((m) => ({ default: m.AdminSellpageListPage })),
)
const AdminSellpageEditorPage = lazy(() =>
  import('./pages/admin/AdminSellpageEditorPage').then((m) => ({ default: m.AdminSellpageEditorPage })),
)

const Loading = ({ what }: { what: string }) => <p style={{ padding: 24 }}>Loading {what}…</p>

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/sellpages" replace />} />

        <Route
          path="/admin"
          element={
            <Suspense fallback={<Loading what="admin" />}>
              <AdminGate />
            </Suspense>
          }
        >
          <Route
            path="sellpages"
            element={
              <Suspense fallback={<Loading what="pages" />}>
                <AdminSellpageListPage />
              </Suspense>
            }
          />
          <Route
            path="sellpages/:id"
            element={
              <Suspense fallback={<Loading what="editor" />}>
                <AdminSellpageEditorPage />
              </Suspense>
            }
          />
        </Route>

        {/* Public route stays outside the guard — no auth, published data only. */}
        <Route path="/s/:slug" element={<PublicSellpagePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

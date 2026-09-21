import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminSellpageListPage } from './pages/admin/AdminSellpageListPage'
import { PublicSellpagePage } from './pages/public/PublicSellpagePage'

// Only the editor route needs the Puck EDITOR bundle (drag/drop, panels, fields UI).
// Lazy-loading it keeps that weight out of the admin list and public-page bundles.
const AdminSellpageEditorPage = lazy(() =>
  import('./pages/admin/AdminSellpageEditorPage').then((m) => ({ default: m.AdminSellpageEditorPage })),
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/sellpages" replace />} />
        <Route path="/admin/sellpages" element={<AdminSellpageListPage />} />
        <Route
          path="/admin/sellpages/:id"
          element={
            <Suspense fallback={<p style={{ padding: 24 }}>Loading editor…</p>}>
              <AdminSellpageEditorPage />
            </Suspense>
          }
        />
        <Route path="/s/:slug" element={<PublicSellpagePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

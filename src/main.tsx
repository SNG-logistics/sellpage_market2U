import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initSellpageStorage } from './features/sellpage/services/initStorage'

// Pick the storage backend before the first render, so no component ever
// reads through the wrong adapter.
initSellpageStorage().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

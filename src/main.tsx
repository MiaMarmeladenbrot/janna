import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// One-shot cleanup of legacy localStorage cache (was a per-browser leak risk
// across users). Safe to remove after a few weeks.
try { localStorage.removeItem('janna-stundentracker'); } catch { /* ignore */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ComingSoon from './ComingSoon.jsx'

// Automatic switch-over: the site itself is untouched underneath, this just
// swaps what renders. Coming Soon is live now and the real site takes back
// over automatically on launch day (Oct 10) — no redeploy needed. Explicit
// VITE_COMING_SOON=true/false locally overrides the date, e.g. to preview
// the real site before launch day; unset (production) always defers to it.
const LAUNCH_DATE = new Date('2026-10-10T00:00:00-04:00');
const comingSoonOverride = import.meta.env.VITE_COMING_SOON;
const showComingSoon =
  comingSoonOverride === 'true' ? true : comingSoonOverride === 'false' ? false : new Date() < LAUNCH_DATE;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {showComingSoon ? <ComingSoon /> : <App />}
  </StrictMode>,
)

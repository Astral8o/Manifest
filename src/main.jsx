import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ComingSoon from './ComingSoon.jsx'

// Automatic switch-over: the site itself is untouched underneath, this just
// swaps what renders. Coming Soon covers the run-up to launch (Oct 1–9),
// then the real site takes back over automatically on launch day (Oct 10)
// — no redeploy needed either direction. VITE_COMING_SOON=true is only an
// early-testing override to force it on before Oct 1; it's intentionally
// not able to force it off, so a stale env var can never block launch day.
const COMING_SOON_START = new Date('2026-10-01T00:00:00-04:00');
const LAUNCH_DATE = new Date('2026-10-10T00:00:00-04:00');
const now = new Date();
const showComingSoon = import.meta.env.VITE_COMING_SOON === 'true' || (now >= COMING_SOON_START && now < LAUNCH_DATE);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {showComingSoon ? <ComingSoon /> : <App />}
  </StrictMode>,
)

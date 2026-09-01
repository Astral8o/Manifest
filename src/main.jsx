import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ComingSoon from './ComingSoon.jsx'

// Automatic switch-over: the site itself is untouched underneath, this just
// swaps what renders. Coming Soon is live now and the real site takes back
// over automatically on launch day (Oct 10) — no redeploy needed. Doesn't
// read any env var: a stale VITE_COMING_SOON left set in Vercel's dashboard
// caused this exact toggle to silently misbehave before, so this can't be
// blocked by project config, only by editing this file.
const LAUNCH_DATE = new Date('2026-10-10T00:00:00-04:00');
const showComingSoon = new Date() < LAUNCH_DATE;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {showComingSoon ? <ComingSoon /> : <App />}
  </StrictMode>,
)

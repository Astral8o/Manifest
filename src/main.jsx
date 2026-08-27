import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ComingSoon from './ComingSoon.jsx'

// Site is in "coming soon" mode — flip to `false` (or remove this override
// and restore `import.meta.env.VITE_COMING_SOON === 'true'`) to go live.
const comingSoon = true

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {comingSoon ? <ComingSoon /> : <App />}
  </StrictMode>,
)

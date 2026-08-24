import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ComingSoon from './ComingSoon.jsx'

const comingSoon = import.meta.env.VITE_COMING_SOON === 'true'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {comingSoon ? <ComingSoon /> : <App />}
  </StrictMode>,
)

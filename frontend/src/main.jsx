import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyTheme, readThemeMode } from './lib/theme'
import './styles/tokens.css'
import './styles/app.css'
import App from './App.jsx'

applyTheme(readThemeMode())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SearchAsset from './asset-search.jsx'
import './asset-search.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SearchAsset />
  </StrictMode>,
)

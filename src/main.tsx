import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { startSoulNexusBridge } from './integration/SoulNexusBridge'
import './index.css'

startSoulNexusBridge()
createRoot(document.getElementById("root")!).render(<App />);

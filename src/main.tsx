import unitsData from "./data/units.v1.2.json";
import { validateUnitsData } from "./game/validate";

validateUnitsData(unitsData as any);
console.log("units ok:", (unitsData as any).meta.version);

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

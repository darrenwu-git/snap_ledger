import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
);

// Development Helper: Unregister Service Workers to prevent caching issues when switching between Prod/Preview and Dev.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      console.log('[Dev] Unregistering Service Worker to ensure fresh code:', registration);
      registration.unregister();
    }
  });
}

import { useEffect } from 'react';
import { LedgerProvider } from './context/LedgerContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import { trackEvent } from './lib/analytics';

function App() {
  useEffect(() => {
    trackEvent('app_opened');
  }, []);

  return (
    <SettingsProvider>
      <AuthProvider>
        <LedgerProvider>
          <Dashboard />
        </LedgerProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;

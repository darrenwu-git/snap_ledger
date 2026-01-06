import { LedgerProvider } from './context/LedgerContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './components/Dashboard';

function App() {
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

import { LedgerProvider } from './context/LedgerContext';
import { SettingsProvider } from './context/SettingsContext';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <SettingsProvider>
      <LedgerProvider>
        <Dashboard />
      </LedgerProvider>
    </SettingsProvider>
  );
}

export default App;

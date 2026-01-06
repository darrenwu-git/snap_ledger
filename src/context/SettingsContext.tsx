import React, { createContext, useContext, useEffect, useState } from 'react';

interface SettingsContextType {
  apiKey: string;
  language: string;
  setLanguage: (lang: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // API Key is now managed via environment variables (VITE_BUILDER_API_KEY)
  const apiKey = import.meta.env.VITE_BUILDER_API_KEY || '';

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('snap_ledger_language') || navigator.language || 'en-US';
  });

  useEffect(() => {
    localStorage.setItem('snap_ledger_language', language);
  }, [language]);

  return (
    <SettingsContext.Provider value={{ apiKey, language, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

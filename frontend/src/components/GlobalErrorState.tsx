import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ErrorDetails {
  message: string;
  stack?: string;
  timestamp: number;
  type: 'error' | 'rejection';
}

interface GlobalErrorContextValue {
  error: ErrorDetails | null;
  setError: (error: ErrorDetails | null) => void;
  clearError: () => void;
}

const GlobalErrorContext = createContext<GlobalErrorContextValue | undefined>(undefined);

export function GlobalErrorStateProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<ErrorDetails | null>(null);

  const clearError = () => setError(null);

  return (
    <GlobalErrorContext.Provider value={{ error, setError, clearError }}>
      {children}
    </GlobalErrorContext.Provider>
  );
}

export function useGlobalErrorState() {
  const context = useContext(GlobalErrorContext);
  if (!context) {
    throw new Error('useGlobalErrorState must be used within GlobalErrorStateProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

/**
 * UI Context Interface
 */
interface UIContextValue {
  isMounted: boolean;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

interface UIProviderProps {
  children: ReactNode;
}

/**
 * UI Context
 * Manages UI state such as mount status
 */
const UIContext = createContext<UIContextValue | undefined>(undefined);

/**
 * UI Provider Component
 * Provides UI state management for client-side rendering
 */
export function UIProvider({ children }: UIProviderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fix hydration mismatch - only render Google Translate on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const value: UIContextValue = {
    isMounted,
    searchInputRef,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

/**
 * Custom hook to use UI context
 * @throws Error if used outside UIProvider
 */
export function useUI(): UIContextValue {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

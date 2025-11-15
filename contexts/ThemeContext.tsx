import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

/**
 * Theme Context Interface
 */
interface ThemeContextValue {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  syncDarkModeToBackend: () => Promise<void>;
  loadDarkModeFromBackend: () => Promise<void>;
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Context
 * Manages application-wide theme state (dark mode)
 * Depends on: AuthContext
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme Provider Component
 * Provides theme state and toggle functionality
 * Works exactly like CartContext - localStorage for guests, database for logged-in users
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const auth = useAuth();
  const { user, checkAuth } = auth;

  const [darkMode, setDarkMode] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  /**
   * Loads dark mode from localStorage on mount (for guest users)
   */
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('dark_mode');
    if (savedDarkMode && !user) {
      try {
        setDarkMode(savedDarkMode === 'true');
      } catch (error) {
        console.error('Failed to load dark mode:', error);
      }
    }
  }, []);

  /**
   * Saves dark mode to localStorage for guest users, syncs to backend for logged-in users
   */
  useEffect(() => {
    // Skip syncing on initial load to prevent infinite loop
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    if (user) {
      // Sync dark mode to backend for logged-in users (debounced)
      const timeoutId = setTimeout(() => {
        syncDarkModeToBackend();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (!user) {
      // Save to localStorage for guest users
      localStorage.setItem('dark_mode', String(darkMode));
    }
  }, [darkMode, user]);

  /**
   * Load dark mode from backend when user is authenticated on mount
   */
  useEffect(() => {
    const initializeDarkMode = async () => {
      const authenticatedUser = await checkAuth();
      if (authenticatedUser && typeof authenticatedUser.darkMode === 'boolean') {
        setDarkMode(authenticatedUser.darkMode);
        localStorage.removeItem('dark_mode');
      }
    };

    initializeDarkMode();
  }, []);

  /**
   * Handle user login/logout
   * - On login: load user's dark mode preference
   * - On logout: revert to localStorage
   */
  useEffect(() => {
    const handleUserChange = async () => {
      if (user && typeof user.darkMode === 'boolean') {
        // User logged in - Load user's dark mode from user data
        setDarkMode(user.darkMode);
        localStorage.removeItem('dark_mode');
      } else if (!isInitialLoad) {
        // User logged out - Load from localStorage
        const savedDarkMode = localStorage.getItem('dark_mode');
        if (savedDarkMode !== null) {
          setDarkMode(savedDarkMode === 'true');
        } else {
          setDarkMode(false);
        }
      }
    };

    // Only run when user state changes (not on initial mount)
    if (!isInitialLoad) {
      handleUserChange();
    }
  }, [user]);

  /**
   * Loads user's dark mode from backend
   */
  const loadDarkModeFromBackend = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.success && typeof data.data.darkMode === 'boolean') {
        setDarkMode(data.data.darkMode);
        localStorage.removeItem('dark_mode');
      }
    } catch (err) {
      console.error('Failed to load dark mode from backend:', err);
    }
  };

  /**
   * Syncs dark mode to backend for logged-in users
   */
  const syncDarkModeToBackend = async () => {
    try {
      await fetch('/api/profile/update-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ darkMode }),
      });
    } catch (err) {
      console.error('Failed to sync dark mode to backend:', err);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const value: ThemeContextValue = {
    darkMode,
    setDarkMode,
    toggleDarkMode,
    syncDarkModeToBackend,
    loadDarkModeFromBackend,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to use Theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

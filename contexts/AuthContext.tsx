import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotification } from './NotificationContext';

/**
 * User Interface
 */
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  city?: string;
  country?: string;
  address?: string;
  house?: string;
  floor?: string;
  role?: string;
  restrictedAccess?: boolean;
  darkMode?: boolean;
}

/**
 * Auth Context Interface
 */
interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  checkAuth: () => Promise<any>;
  handleLogin: (email: string, password: string) => Promise<void>;
  handleRegister: (email: string, password: string, name: string, phone: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Context
 * Manages authentication state and user operations
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth Provider Component
 * Provides authentication state and functions to manage user login/logout
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { addNotification } = useNotification();

  /**
   * Checks if user is authenticated
   * Called on mount to restore user session
   */
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
        return data.data;
      }
      return null;
    } catch (err) {
      console.log('Not authenticated');
      return null;
    }
  };

  /**
   * Handles user login
   * @param email - User email
   * @param password - User password
   */
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        setShowAuthModal(false);
        if (data.data.restrictedAccess) {
          addNotification(
            'Login successful! Note: Your account has restricted access. Please add a phone number or PIN to unlock all features.',
            'warning'
          );
        } else {
          addNotification('Login successful!', 'success');
        }
      } else {
        addNotification(data.error || 'Login failed', 'error');
      }
    } catch (err) {
      addNotification('Network error. Failed to login.', 'error');
      console.error('Login error:', err);
    }
  };

  /**
   * Handles user registration
   * @param email - User email
   * @param password - User password
   * @param name - User name
   * @param phone - User phone number
   */
  const handleRegister = async (email: string, password: string, name: string, phone: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, phone }),
      });

      const data = await response.json();

      if (data.success) {
        await handleLogin(email, password);
      } else {
        addNotification(data.error || 'Registration failed', 'error');
      }
    } catch (err) {
      addNotification('Network error. Failed to register.', 'error');
      console.error('Register error:', err);
    }
  };

  /**
   * Handles user logout
   */
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      localStorage.removeItem('shopping_cart');
      addNotification('Logged out successfully', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextValue = {
    user,
    setUser,
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    checkAuth,
    handleLogin,
    handleRegister,
    handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use Auth context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

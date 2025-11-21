import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
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
  updateSession: () => Promise<any>;
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
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { addNotification } = useNotification();

  // Sync session with local user state
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser(session.user as User);
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [session, status]);

  const checkAuth = async () => {
    // NextAuth handles this automatically via useSession
    return session?.user || null;
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        addNotification(result.error, 'error');
      } else {
        setShowAuthModal(false);
        addNotification('Login successful!', 'success');
      }
    } catch (err) {
      addNotification('Login failed', 'error');
    }
  };

  const handleRegister = async (email: string, password: string, name: string, phone: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone }),
      });

      const data = await response.json();

      if (data.success) {
        await handleLogin(email, password);
      } else {
        addNotification(data.error || 'Registration failed', 'error');
      }
    } catch (err) {
      addNotification('Registration failed', 'error');
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    localStorage.removeItem('shopping_cart');
    addNotification('Logged out successfully', 'info');
  };

  const value: AuthContextValue = {
    user,
    setUser,
    updateSession: update,
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

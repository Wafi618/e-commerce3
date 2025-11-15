import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShoppingCart, Moon, Sun, LogIn, LogOut, UserCircle, History, User, MessageSquare, Menu, X, MessageCircle } from 'lucide-react';
import { useAuth, useCart, useTheme, useUI, useMessage } from '@/contexts';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, showBackButton = false }) => {
  const router = useRouter();
  const { user, setShowAuthModal, setAuthMode, handleLogout } = useAuth();
  const { cart } = useCart();
  const { darkMode, toggleDarkMode } = useTheme();
  const { isMounted } = useUI();
  const { setShowMessageModal } = useMessage();
  const [isCartUpdated, setIsCartUpdated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (cart.length > 0) {
      setIsCartUpdated(true);
      const timer = setTimeout(() => setIsCartUpdated(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cart]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Navigation */}
      <nav className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm sticky top-0 z-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {showBackButton ? (
                <Link
                  href="/"
                  className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  ← Back to Shop
                </Link>
              ) : (
                <>
                  <a href="/" className="flex items-center space-x-2">
                    <ShoppingCart className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} notranslate`}>
                      Star Accessories
                    </span>
                  </a>
                  {/* Google Translate Widget - Only render on client to avoid hydration mismatch */}
                  {isMounted && <div id="google_translate_element" className="text-sm hidden md:block"></div>}
                </>
              )}
              {title && showBackButton && (
                <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</span>
              )}
            </div>

            <div className="flex items-center">
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-4">
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'} hover:opacity-80`}
                  title="Toggle Dark Mode"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {user ? (
                  <>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Hello, {user.name || user.email}
                    </span>
                    {user.role === 'CUSTOMER' && (
                      <>
                        <Link href="/profile" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} flex items-center space-x-1`}>
                          <UserCircle className="w-5 h-5" />
                          <span className="text-sm">Profile</span>
                        </Link>
                        <Link href="/my-orders" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} flex items-center space-x-1`}>
                          <History className="w-5 h-5" />
                          <span className="text-sm">My Orders</span>
                        </Link>
                        <button onClick={() => setShowMessageModal(true)} className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} flex items-center space-x-1`}>
                          <MessageSquare className="w-5 h-5" />
                          <span className="text-sm">Messages</span>
                        </button>
                      </>
                    )}
                    {user.role === 'ADMIN' && (
                      <Link href="/admin" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} flex items-center space-x-1`}>
                        <User className="w-5 h-5" />
                        <span className="text-sm">Admin</span>
                      </Link>
                    )}
                    <button onClick={handleLogout} className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} flex items-center space-x-1`}>
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} flex items-center space-x-1`}>
                    <LogIn className="w-5 h-5" />
                    <span className="text-sm">Login</span>
                  </button>
                )}

                <Link href="/cart" className="relative p-2">
                  <ShoppingCart className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  {cart.length > 0 && (
                    <span className={`absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ${isCartUpdated ? 'cart-updated' : ''}`}>
                      {cart.reduce((count, item) => count + item.quantity, 0)}
                    </span>
                  )}
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center space-x-2">
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'} hover:opacity-80`}
                  title="Toggle Dark Mode"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <Link href="/cart" className="relative p-2">
                  <ShoppingCart className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  {cart.length > 0 && (
                    <span className={`absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ${isCartUpdated ? 'cart-updated' : ''}`}>
                      {cart.reduce((count, item) => count + item.quantity, 0)}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`p-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`md:hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  <div className="px-3 py-2">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Hello, {user.name || user.email}
                    </span>
                  </div>
                  {user.role === 'CUSTOMER' && (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/my-orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={() => { setShowMessageModal(true); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Messages
                      </button>
                    </>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t mt-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/contact"
                className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} font-medium`}
              >
                Contact Us | যোগাযোগ করুন
              </a>
              <span className={`hidden sm:inline ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
              <a
                href="https://wa.me/19417876746?text=Hi!%20I%20have%20a%20question%20about%20Star%20Accessories"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
              </a>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              © 2025 <span className="notranslate">Star Accessories and Fashion House</span>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

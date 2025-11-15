import React, { ReactNode, useRef } from 'react';
import { ThemeProvider } from './ThemeContext';
import { UIProvider } from './UIContext';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { ProductProvider } from './ProductContext';
import { OrderProvider } from './OrderContext';
import { MessageProvider } from './MessageContext';
import { NotificationProvider } from './NotificationContext';

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Inner component to bridge AuthProvider and CartProvider
 * This allows us to pass the cart merge function to AuthProvider
 */
function AuthCartBridge({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}

/**
 * App Provider Component
 * Wraps all context providers in the correct dependency order
 *
 * Dependency hierarchy:
 * 1. UIProvider (independent)
 * 2. MessageProvider (independent)
 * 3. AuthProvider (independent)
 * 4. ThemeProvider (depends on AuthProvider) - same as cart
 * 5. CartProvider (depends on AuthProvider, UIProvider)
 * 6. ProductProvider (depends on UIProvider)
 * 7. OrderProvider (depends on UIProvider, ProductProvider, MessageProvider)
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <UIProvider>
      <NotificationProvider>
        <MessageProvider>
          <AuthProvider>
            <ThemeProvider>
              <AuthCartBridge>
                <ProductProvider>
                  <OrderProvider>
                    {children}
                  </OrderProvider>
                </ProductProvider>
              </AuthCartBridge>
            </ThemeProvider>
          </AuthProvider>
        </MessageProvider>
      </NotificationProvider>
    </UIProvider>
  );
}

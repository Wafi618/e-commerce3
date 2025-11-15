import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

/**
 * Cart Item Interface
 */
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
  category?: string;
}

/**
 * Address Data Interface
 */
interface AddressData {
  phone: string;
  city: string;
  country: string;
  address: string;
  house: string;
  floor: string;
  notes: string;
}

/**
 * Cart Context Interface
 */
interface CartContextValue {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  checkoutLoading: boolean;
  setCheckoutLoading: (loading: boolean) => void;
  addressData: AddressData;
  setAddressData: (data: AddressData) => void;
  showAddressModal: boolean;
  setShowAddressModal: (show: boolean) => void;
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  handleCheckout: () => void;
  proceedToPayment: () => Promise<void>;
  handleManualPaymentSubmit: (bkashNumber: string, trxId: string) => Promise<void>;
  syncCartToBackend: () => Promise<void>;
  loadCartFromBackend: () => Promise<void>;
  mergeGuestCartWithUserCart: (guestCart: CartItem[]) => Promise<void>;
  cartTotal: number;
  reorder: (order: any, products: any[]) => void;
}

interface CartProviderProps {
  children: ReactNode;
}

/**
 * Cart Context
 * Manages shopping cart state and operations
 * Depends on: AuthContext, UIContext
 */
const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * Cart Provider Component
 * Provides cart management functionality including checkout and synchronization
 */
export function CartProvider({ children }: CartProviderProps) {
  const auth = useAuth();
  const { user, checkAuth } = auth;
  const { addNotification } = useNotification();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [addressData, setAddressData] = useState<AddressData>({
    phone: '',
    city: '',
    country: 'Bangladesh',
    address: '',
    house: '',
    floor: '',
    notes: '',
  });

  /**
   * Loads cart from localStorage on mount (for guest users)
   */
  useEffect(() => {
    const savedCart = localStorage.getItem('shopping_cart');
    if (savedCart && !user) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
  }, []);

  /**
   * Saves cart to localStorage for guest users, syncs to backend for logged-in users
   */
  useEffect(() => {
    // Skip syncing on initial load to prevent infinite loop
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    if (user && cart.length >= 0) {
      // Sync cart to backend for logged-in users (debounced)
      const timeoutId = setTimeout(() => {
        syncCartToBackend();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (!user) {
      // Save to localStorage for guest users
      if (cart.length > 0) {
        localStorage.setItem('shopping_cart', JSON.stringify(cart));
      } else {
        localStorage.removeItem('shopping_cart');
      }
    }
  }, [cart, user]);

  /**
   * Load cart from backend when user is authenticated on mount
   */
  useEffect(() => {
    const initializeCart = async () => {
      const authenticatedUser = await checkAuth();
      if (authenticatedUser) {
        // Load user's cart from backend
        const cartResponse = await fetch('/api/cart');
        const cartData = await cartResponse.json();
        if (cartData.success && Array.isArray(cartData.data)) {
          setCart(cartData.data);
          localStorage.removeItem('shopping_cart');
        }
      }
    };

    initializeCart();
  }, []);

  /**
   * Handle user login/logout
   * - On login: merge guest cart with user cart
   * - On logout: clear cart and navigate to storefront
   */
  useEffect(() => {
    const handleUserChange = async () => {
      if (user) {
        // User logged in - Save guest cart before loading user cart
        const savedCart = localStorage.getItem('shopping_cart');
        const guestCart = savedCart ? JSON.parse(savedCart) : [];

        // Load user's cart from backend
        await loadCartFromBackend();

        // Merge guest cart with user cart if guest had items
        if (guestCart.length > 0) {
          await mergeGuestCartWithUserCart(guestCart);
        }
      } else if (!isInitialLoad) {
        // User logged out - Clear cart
        setCart([]);
        // Navigation is handled by Next.js router in components
      }
    };

    // Only run when user state changes (not on initial mount)
    if (!isInitialLoad) {
      handleUserChange();
    }
  }, [user]);

  /**
   * Listen for cart-cleared event from success page
   */
  useEffect(() => {
    const handleCartCleared = () => {
      setCart([]);
      if (user) {
        loadCartFromBackend();
      }
    };

    window.addEventListener('cart-cleared', handleCartCleared);
    return () => window.removeEventListener('cart-cleared', handleCartCleared);
  }, [user]);

  /**
   * Loads user's cart from backend
   */
  const loadCartFromBackend = async () => {
    try {
      const response = await fetch('/api/cart');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCart(data.data);
        // Clear localStorage cart after loading from backend
        localStorage.removeItem('shopping_cart');
      }
    } catch (err) {
      console.error('Failed to load cart from backend:', err);
      // Don't clear cart on error - keep existing state
    }
  };

  /**
   * Syncs cart to backend for logged-in users
   */
  const syncCartToBackend = async () => {
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart }),
      });
    } catch (err) {
      console.error('Failed to sync cart to backend:', err);
    }
  };

  /**
   * Adds a product to the cart
   * @param product - Product to add
   */
  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      // Check if adding one more would exceed stock
      if (existing.quantity >= product.stock) {
        addNotification(`Cannot add more. Only ${product.stock} items available in stock.`, 'warning');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      // Check if product has stock
      if (product.stock < 1) {
        addNotification('This product is out of stock.', 'warning');
        return;
      }
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  /**
   * Removes a product from the cart
   * @param productId - ID of product to remove
   */
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  /**
   * Updates quantity of a product in cart
   * @param productId - ID of product to update
   * @param delta - Change in quantity (+1 or -1)
   */
  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        // Check if increasing quantity would exceed stock
        if (delta > 0 && newQty > item.stock) {
          addNotification(`Cannot add more. Only ${item.stock} items available in stock.`, 'warning');
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  /**
   * Initiates checkout process
   * Validates user profile and shows address modal
   */
  const handleCheckout = () => {
    // Check if user has mandatory profile fields filled
    if (user && (!user.phone || !user.city || !user.address)) {
      addNotification('Please complete your profile (Phone, City, and Address) before checkout.', 'warning');
      // Redirect to profile page
      if (typeof window !== 'undefined') {
        window.location.href = '/profile';
      }
      return;
    }

    // Auto-fill address from user profile if available
    if (user) {
      setAddressData({
        phone: user.phone || '',
        city: user.city || '',
        country: user.country || 'Bangladesh',
        address: user.address || '',
        house: user.house || '',
        floor: user.floor || '',
        notes: '', // Always keep notes empty
      });
    }
    // Show address modal before proceeding to payment
    setShowAddressModal(true);
  };

  /**
   * Proceeds to bKash payment
   * Creates checkout session and redirects to bKash
   */
  const proceedToPayment = async () => {
    // Validate address
    if (!addressData.phone || !addressData.city || !addressData.address) {
      addNotification('Please fill in required fields: Phone, City, and Address', 'warning');
      return;
    }

    setCheckoutLoading(true);
    setShowAddressModal(false);

    try {
      const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
      const invoiceNumber = `INV-${Date.now()}`;

      // Store cart items and address temporarily for the callback
      localStorage.setItem('checkout_cart', JSON.stringify(cart));
      localStorage.setItem('checkout_address', JSON.stringify(addressData));

      const response = await fetch('/api/bkash/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total.toString(),
          invoiceNumber: invoiceNumber,
          cartItems: cart,
          customerEmail: user?.email || '',
          customerName: user?.name || 'Guest',
          userId: user?.id || null,
          ...addressData,
        }),
      });

      const data = await response.json();

      if (data.success && data.bkashURL) {
        // Redirect to bKash Checkout
        window.location.href = data.bkashURL;
      } else {
        addNotification(data.error || 'Failed to create checkout session', 'error');
      }
    } catch (err) {
      addNotification('Network error. Failed to process checkout.', 'error');
      console.error('Checkout error:', err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  /**
   * Handles manual bKash payment submission
   */
  const handleManualPaymentSubmit = async (bkashNumber: string, trxId: string) => {
    if (!bkashNumber.trim() || !trxId.trim()) {
      addNotification('bKash number and Transaction ID are required.', 'warning');
      return;
    }

    setCheckoutLoading(true);
    setShowAddressModal(false);

    try {
      const response = await fetch('/api/orders/create-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartTotal,
          cartItems: cart,
          customerEmail: user?.email || '',
          customerName: user?.name || 'Guest',
          userId: user?.id || null,
          ...addressData,
          bkashNumber,
          trxId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to a success page with manual flag
        window.location.href = `/checkout/success?manual=true&order_id=${data.orderId}&trx_id=${trxId}`;
      } else {
        addNotification(data.error || 'Failed to place manual order.', 'error');
      }
    } catch (err) {
      addNotification('Network error. Failed to place order.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  /**
   * Merges guest cart with user cart after login
   * @param guestCart - Cart items from guest session
   */
  const mergeGuestCartWithUserCart = async (guestCart: CartItem[]) => {
    try {
      // Get current user cart
      const response = await fetch('/api/cart');
      const data = await response.json();

      if (data.success) {
        const userCart = data.data;

        // Merge carts: combine quantities for same items
        const mergedCart = [...userCart];

        guestCart.forEach(guestItem => {
          const existingItem = mergedCart.find(item => item.id === guestItem.id);
          if (existingItem) {
            existingItem.quantity += guestItem.quantity;
          } else {
            mergedCart.push(guestItem);
          }
        });

        // Update cart state and sync to backend
        setCart(mergedCart);

        // Sync merged cart to backend
        await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cart: mergedCart }),
        });

        // Clear localStorage
        localStorage.removeItem('shopping_cart');
      }
    } catch (err) {
      console.error('Failed to merge guest cart:', err);
    }
  };

  const reorder = (order: any, products: any[]) => {
    if (!order || !order.orderItems) {
      addNotification('Invalid order for reordering.', 'warning');
      return;
    }

    const outOfStockItems: string[] = [];
    let itemsAdded = 0;

    const newCart = [...cart];

    order.orderItems.forEach((orderItem: any) => {
      const product = products.find(p => p.id === orderItem.product.id);

      if (product) {
        if (product.stock >= orderItem.quantity) {
          const existingCartItem = newCart.find(item => item.id === product.id);
          if (existingCartItem) {
            existingCartItem.quantity += orderItem.quantity;
            if (existingCartItem.quantity > product.stock) {
                existingCartItem.quantity = product.stock;
            }
          } else {
            newCart.push({ ...product, quantity: orderItem.quantity });
          }
          itemsAdded++;
        } else {
          outOfStockItems.push(orderItem.product.name);
        }
      } else {
        outOfStockItems.push(orderItem.product.name);
      }
    });

    setCart(newCart);

    let message = '';
    if (itemsAdded > 0) {
      message += `${itemsAdded} item(s) have been added to your cart.`;
    }

    if (outOfStockItems.length > 0) {
      message += `\nThe following items are out of stock and were not added: ${outOfStockItems.join(', ')}.`;
    }

    if (message) {
      addNotification(message, outOfStockItems.length > 0 ? 'warning' : 'success');
    } else {
      addNotification('No items from this order could be reordered.', 'info');
    }
  };

  /**
   * Computed cart total
   */
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  }, [cart]);

  const value: CartContextValue = {
    cart,
    setCart,
    checkoutLoading,
    setCheckoutLoading,
    addressData,
    setAddressData,
    showAddressModal,
    setShowAddressModal,
    addToCart,
    removeFromCart,
    updateQuantity,
    handleCheckout,
    proceedToPayment,
    handleManualPaymentSubmit,
    syncCartToBackend,
    loadCartFromBackend,
    mergeGuestCartWithUserCart,
    cartTotal,
    reorder,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/**
 * Custom hook to use Cart context
 * @throws Error if used outside CartProvider
 */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

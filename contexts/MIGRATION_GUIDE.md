# Migration Guide: From Centralized to Context-based State Management

## Overview

This guide will help you migrate from the centralized state management in `pages/index.tsx` to the new Context API architecture.

## Step 1: Wrap Your Application

### Update `pages/_app.tsx` (or create it if it doesn't exist)

```tsx
import { AppProvider } from '@/contexts';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <Component {...pageProps} />
    </AppProvider>
  );
}
```

## Step 2: Update `pages/index.tsx`

### Before (Centralized State):

```tsx
export default function ECommerceApp() {
  const [view, setView] = useState('storefront');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  // ... 50+ lines of state declarations

  // ... 500+ lines of logic

  return (
    <div>
      {view === 'storefront' && (
        <StorefrontView
          user={user}
          products={products}
          cart={cart}
          addToCart={addToCart}
          // ... 20+ props
        />
      )}
      {/* More views */}
    </div>
  );
}
```

### After (Context-based):

```tsx
import {
  useUI,
  useAuth,
  useCart,
  useProduct,
  useOrder,
  useMessage,
  useTheme,
} from '@/contexts';

// Import modals and views
import { StorefrontView } from '@/components/views/StorefrontView';
import { CartView } from '@/components/views/CartView';
import { AdminView } from '@/components/views/AdminView';
import { ProfileView } from '@/components/views/ProfileView';
import { MyOrdersView } from '@/components/views/MyOrdersView';

import { AuthModal } from '@/components/modals/AuthModal';
import { SearchModal } from '@/components/modals/SearchModal';
import { AddressModal } from '@/components/modals/AddressModal';
import { ProductModal } from '@/components/modals/ProductModal';
import { OrderDetailsModal } from '@/components/modals/OrderDetailsModal';
import { MessageModal } from '@/components/modals/MessageModal';

export default function ECommerceApp() {
  // Access all context values through hooks
  const { view, isMounted, searchInputRef } = useUI();
  const {
    user,
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    handleLogin,
    handleRegister,
    handleLogout
  } = useAuth();

  const {
    cart,
    cartTotal,
    removeFromCart,
    updateQuantity,
    handleCheckout,
    checkoutLoading,
    showAddressModal,
    setShowAddressModal,
    addressData,
    setAddressData,
    proceedToPayment,
  } = useCart();

  const {
    products,
    loading,
    error,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
    searchQuery,
    setSearchQuery,
    searchSuggestions,
    showSuggestions,
    setShowSuggestions,
    showSearchModal,
    setShowSearchModal,
    editingProduct,
    setEditingProduct,
    showProductModal,
    setShowProductModal,
    saveProduct,
    deleteProduct,
  } = useProduct();

  const {
    orders,
    selectedOrder,
    setSelectedOrder,
    showOrderDetailsModal,
    setShowOrderDetailsModal,
    updateOrderStatus,
    deleteOrder,
  } = useOrder();

  const {
    messages,
    setMessages,
    showMessageModal,
    setShowMessageModal,
  } = useMessage();

  const { darkMode, setDarkMode } = useTheme();

  return (
    <div>
      {/* Views remain the same, just pass the values from hooks */}
      {view === 'storefront' && (
        <StorefrontView
          user={user}
          products={products}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          cart={cart}
          addToCart={addToCart}
          setView={setView}
          setShowSearchModal={setShowSearchModal}
          setShowMessageModal={setShowMessageModal}
          setShowAuthModal={setShowAuthModal}
          setAuthMode={setAuthMode}
          handleLogout={handleLogout}
          loading={loading}
          error={error}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          isMounted={isMounted}
        />
      )}

      {view === 'cart' && (
        <CartView
          cart={cart}
          removeFromCart={removeFromCart}
          updateQuantity={updateQuantity}
          cartTotal={cartTotal}
          handleCheckout={handleCheckout}
          checkoutLoading={checkoutLoading}
          setView={setView}
          darkMode={darkMode}
        />
      )}

      {view === 'admin' && (
        <AdminView
          products={products}
          orders={orders}
          user={user}
          messages={messages}
          loading={loading}
          setView={setView}
          setShowProductModal={setShowProductModal}
          setEditingProduct={setEditingProduct}
          deleteProduct={deleteProduct}
          updateOrderStatus={updateOrderStatus}
          deleteOrder={deleteOrder}
          setSelectedOrder={setSelectedOrder}
          setShowOrderDetailsModal={setShowOrderDetailsModal}
          setShowMessageModal={setShowMessageModal}
          ProductModal={ProductModal}
          editingProduct={editingProduct}
          showProductModal={showProductModal}
          saveProduct={saveProduct}
        />
      )}

      {view === 'profile' && (
        <ProfileView
          user={user}
          setUser={setUser}
          setView={setView}
          darkMode={darkMode}
        />
      )}

      {view === 'my-orders' && (
        <MyOrdersView
          user={user}
          setView={setView}
          darkMode={darkMode}
        />
      )}

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          authMode={authMode}
          setAuthMode={setAuthMode}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
          setShowAuthModal={setShowAuthModal}
        />
      )}

      {showSearchModal && (
        <SearchModal
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchSuggestions={searchSuggestions}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          setShowSearchModal={setShowSearchModal}
          darkMode={darkMode}
          searchInputRef={searchInputRef}
        />
      )}

      {showAddressModal && (
        <AddressModal
          addressData={addressData}
          setAddressData={setAddressData}
          setShowAddressModal={setShowAddressModal}
          proceedToPayment={proceedToPayment}
          checkoutLoading={checkoutLoading}
          setView={setView}
        />
      )}

      {showOrderDetailsModal && (
        <OrderDetailsModal
          selectedOrder={selectedOrder}
          setShowOrderDetailsModal={setShowOrderDetailsModal}
        />
      )}

      {showMessageModal && (
        <MessageModal
          user={user}
          messages={messages}
          setMessages={setMessages}
          darkMode={darkMode}
          setShowMessageModal={setShowMessageModal}
        />
      )}
    </div>
  );
}
```

## Step 3: Simplify Component Props (Optional but Recommended)

Instead of passing props through the component tree, you can use context hooks directly in child components.

### Example: Updating StorefrontView

#### Before:
```tsx
function StorefrontView({
  user,
  products,
  cart,
  addToCart,
  setView,
  darkMode,
  // ... many more props
}) {
  // component logic
}
```

#### After:
```tsx
import { useAuth, useProduct, useCart, useUI, useTheme } from '@/contexts';

function StorefrontView() {
  const { user, handleLogout } = useAuth();
  const { products, categories, selectedCategory, setSelectedCategory } = useProduct();
  const { cart, addToCart } = useCart();
  const { setView } = useUI();
  const { darkMode, setDarkMode } = useTheme();

  // component logic
}
```

This eliminates props drilling and makes components more maintainable.

## Step 4: Update View Components

Each view component can now access context directly:

### CartView Example:
```tsx
import { useCart, useUI, useTheme } from '@/contexts';

export function CartView() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    handleCheckout,
    checkoutLoading
  } = useCart();
  const { setView } = useUI();
  const { darkMode } = useTheme();

  // component logic
}
```

### AdminView Example:
```tsx
import {
  useProduct,
  useOrder,
  useMessage,
  useAuth,
  useUI
} from '@/contexts';

export function AdminView() {
  const { user } = useAuth();
  const {
    products,
    loading,
    setShowProductModal,
    setEditingProduct,
    deleteProduct
  } = useProduct();
  const {
    orders,
    updateOrderStatus,
    deleteOrder,
    setSelectedOrder,
    setShowOrderDetailsModal
  } = useOrder();
  const { messages, setShowMessageModal } = useMessage();
  const { setView } = useUI();

  // component logic
}
```

## Step 5: Update Modal Components

Modals can also use contexts directly:

### AuthModal Example:
```tsx
import { useAuth } from '@/contexts';

export function AuthModal() {
  const {
    authMode,
    setAuthMode,
    handleLogin,
    handleRegister,
    showAuthModal,
    setShowAuthModal
  } = useAuth();

  // No props needed!
}
```

## Migration Checklist

- [ ] Create `pages/_app.tsx` and wrap with `<AppProvider>`
- [ ] Update `pages/index.tsx` to use context hooks
- [ ] Remove state declarations from `pages/index.tsx`
- [ ] Remove function definitions from `pages/index.tsx`
- [ ] Update view components to use context hooks (optional)
- [ ] Update modal components to use context hooks (optional)
- [ ] Test authentication flow (login, logout)
- [ ] Test cart operations (add, remove, update quantity)
- [ ] Test guest cart → user cart merge
- [ ] Test checkout flow
- [ ] Test product CRUD operations
- [ ] Test order management
- [ ] Test search functionality
- [ ] Test theme switching
- [ ] Verify all API endpoints are working
- [ ] Check for console errors
- [ ] Test on different browsers

## Benefits After Migration

1. **Cleaner Code**: No more 700+ line component files
2. **Better Separation**: Each domain has its own focused context
3. **Easier Testing**: Mock individual contexts for unit tests
4. **No Props Drilling**: Access state anywhere without passing through components
5. **Type Safety**: Full TypeScript support throughout
6. **Better Performance**: Optimized re-renders with focused contexts
7. **Maintainability**: Easy to find and update domain-specific logic
8. **Scalability**: Easy to add new features without modifying existing code

## Backward Compatibility

The new architecture is designed to be backward compatible. You can:

1. Keep the current `pages/index.tsx` as is and gradually migrate
2. Use context hooks in new components while keeping props in existing ones
3. Migrate one view at a time to minimize risk

## Troubleshooting

### Issue: "Hook called outside of provider"
**Solution**: Ensure `<AppProvider>` wraps your entire app in `_app.tsx`

### Issue: State not persisting
**Solution**: Check that the context provider is at the correct level in the component tree

### Issue: Cart not syncing
**Solution**: Verify user is authenticated and API endpoints are accessible

### Issue: Infinite re-renders
**Solution**: Check for missing dependencies in useEffect hooks

## Advanced: Further Refactoring

After successful migration, consider:

1. **Remove props entirely**: Use context hooks directly in all components
2. **Create compound components**: Group related UI elements
3. **Add error boundaries**: Wrap contexts with error boundaries
4. **Implement React Query**: Replace some contexts with server state management
5. **Add middleware**: Implement action logging or analytics

## Need Help?

Refer to:
- `contexts/README.md` - Comprehensive architecture documentation
- Context source files - Each has detailed JSDoc comments
- TypeScript types - Full type definitions in each context

## Example: Complete Migration of One Component

### Before: ProductCard.tsx
```tsx
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  darkMode: boolean;
}

export function ProductCard({ product, onAddToCart, darkMode }: ProductCardProps) {
  return (
    <div className={darkMode ? 'dark' : ''}>
      <h3>{product.name}</h3>
      <p>{product.price}</p>
      <button onClick={() => onAddToCart(product)}>
        Add to Cart
      </button>
    </div>
  );
}
```

### After: ProductCard.tsx
```tsx
import { useCart, useTheme } from '@/contexts';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { darkMode } = useTheme();

  return (
    <div className={darkMode ? 'dark' : ''}>
      <h3>{product.name}</h3>
      <p>{product.price}</p>
      <button onClick={() => addToCart(product)}>
        Add to Cart
      </button>
    </div>
  );
}
```

**Benefits**:
- Reduced props from 3 to 1
- Component is more self-contained
- Easier to test (mock contexts instead of props)
- Type-safe with TypeScript

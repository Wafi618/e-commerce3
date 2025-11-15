# React Context API Architecture

## Overview

This directory contains a comprehensive Context API architecture that decentralizes state management from the main `index.tsx` file. The state has been organized into 7 focused contexts, each managing a specific domain of the application.

## Context Files Created

### 1. **ThemeContext.tsx**
**Purpose**: Manages application-wide theme state (dark mode)

**State**:
- `darkMode`: boolean - Current theme mode

**Functions**:
- `setDarkMode(value: boolean)`: Set dark mode state
- `toggleDarkMode()`: Toggle between light and dark mode

**Dependencies**: None (independent)

**Hook**: `useTheme()`

---

### 2. **UIContext.tsx**
**Purpose**: Manages UI state such as current view and client-side rendering

**State**:
- `view`: string - Current application view ('storefront', 'cart', 'admin', 'profile', 'my-orders')
- `isMounted`: boolean - Client-side hydration status
- `searchInputRef`: React ref - Reference to search input element

**Functions**:
- `setView(view: string)`: Change application view

**Side Effects**:
- Sets `isMounted` to true on component mount (fixes hydration mismatch)
- Handles URL view parameter on mount (for navigation from other pages)

**Dependencies**: None (independent)

**Hook**: `useUI()`

---

### 3. **MessageContext.tsx**
**Purpose**: Manages customer messages/inquiries

**State**:
- `messages`: Message[] - List of customer messages
- `showMessageModal`: boolean - Message modal visibility

**Functions**:
- `setMessages(messages: Message[])`: Update messages list
- `setShowMessageModal(show: boolean)`: Toggle message modal
- `fetchMessages()`: Fetch messages from API

**Dependencies**: None (independent)

**Hook**: `useMessage()`

---

### 4. **AuthContext.tsx**
**Purpose**: Manages authentication state and user operations

**State**:
- `user`: User | null - Current authenticated user
- `showAuthModal`: boolean - Auth modal visibility
- `authMode`: 'login' | 'register' - Current auth modal mode

**Functions**:
- `checkAuth()`: Check if user is authenticated (returns user data)
- `handleLogin(email, password)`: Login user
- `handleRegister(email, password, name)`: Register new user
- `handleLogout()`: Logout user
- `setUser(user: User | null)`: Update user state
- `setShowAuthModal(show: boolean)`: Toggle auth modal
- `setAuthMode(mode: 'login' | 'register')`: Set auth modal mode

**Side Effects**:
- Calls `checkAuth()` on mount to restore user session
- Clears localStorage 'shopping_cart' on logout

**Dependencies**: None (independent, but CartContext listens to user changes)

**Hook**: `useAuth()`

---

### 5. **CartContext.tsx**
**Purpose**: Manages shopping cart state and checkout operations

**State**:
- `cart`: CartItem[] - Shopping cart items
- `checkoutLoading`: boolean - Checkout loading state
- `addressData`: AddressData - Delivery address information
- `showAddressModal`: boolean - Address modal visibility

**Functions**:
- `addToCart(product)`: Add product to cart (with stock validation)
- `removeFromCart(productId)`: Remove product from cart
- `updateQuantity(productId, delta)`: Update item quantity (with stock validation)
- `handleCheckout()`: Initiate checkout (validates user profile)
- `proceedToPayment()`: Process bKash payment
- `syncCartToBackend()`: Sync cart to backend for logged-in users
- `loadCartFromBackend()`: Load cart from backend
- `mergeGuestCartWithUserCart(guestCart)`: Merge guest cart with user cart on login

**Computed Values**:
- `cartTotal`: Total cart price (memoized)

**Side Effects**:
- Loads cart from localStorage on mount (for guest users)
- Saves cart to localStorage for guest users (debounced)
- Syncs cart to backend for logged-in users (debounced, 500ms)
- Loads user cart from backend on authentication
- Merges guest cart with user cart on login
- Clears cart and navigates to storefront on logout
- Listens for 'cart-cleared' window event (from success page)

**Dependencies**:
- **AuthContext**: Uses `user` state, `checkAuth()` function
- **UIContext**: Uses `setView()` function

**Hook**: `useCart()`

---

### 6. **ProductContext.tsx**
**Purpose**: Manages product state, search, and CRUD operations

**State**:
- `products`: Product[] - List of products
- `loading`: boolean - Loading state
- `error`: string | null - Error message
- `selectedCategory`: string - Current category filter
- `searchTerm`: string - Current search input
- `searchQuery`: string - Applied search query
- `searchSuggestions`: Product[] - Search suggestions
- `showSuggestions`: boolean - Suggestions visibility
- `showSearchModal`: boolean - Search modal visibility
- `editingProduct`: Product | null - Product being edited
- `showProductModal`: boolean - Product modal visibility

**Functions**:
- `fetchProducts()`: Fetch products from API (filtered by category and search)
- `fetchSearchSuggestions(query)`: Fetch search suggestions
- `saveProduct(product)`: Create or update product
- `deleteProduct(id)`: Delete product

**Computed Values**:
- `categories`: Unique categories from products (memoized)

**Side Effects**:
- Fetches products when `selectedCategory` or `searchQuery` changes
- Fetches search suggestions when `searchTerm` changes (debounced, 300ms)
- Restores focus to search input after suggestion updates

**Dependencies**:
- **UIContext**: Uses `searchInputRef` for focus management

**Hook**: `useProduct()`

---

### 7. **OrderContext.tsx**
**Purpose**: Manages order state and operations (admin and customer views)

**State**:
- `orders`: Order[] - List of all orders (admin)
- `myOrders`: Order[] - User's orders
- `showOrderDetailsModal`: boolean - Order details modal visibility
- `selectedOrder`: Order | null - Currently selected order

**Functions**:
- `fetchOrders()`: Fetch orders from API
- `updateOrderStatus(orderId, newStatus)`: Update order status
- `deleteOrder(orderId, orderStatus)`: Delete order (only completed/cancelled)

**Side Effects**:
- Fetches orders and messages when view changes to 'admin'
- Refetches products after order status change (to update stock display)

**Dependencies**:
- **UIContext**: Uses `view` state
- **ProductContext**: Uses `fetchProducts()` function
- **MessageContext**: Uses `fetchMessages()` function

**Hook**: `useOrder()`

---

## AppProvider Component

The `AppProvider.tsx` file wraps all context providers in the correct dependency order:

```
ThemeProvider          (independent)
  └─ UIProvider        (independent)
      └─ MessageProvider   (independent)
          └─ AuthProvider   (independent)
              └─ CartProvider    (depends on: Auth, UI)
                  └─ ProductProvider   (depends on: UI)
                      └─ OrderProvider    (depends on: UI, Product, Message)
```

### Usage

Wrap your entire application with the `AppProvider`:

```tsx
import { AppProvider } from '@/contexts';

export default function App({ Component, pageProps }) {
  return (
    <AppProvider>
      <Component {...pageProps} />
    </AppProvider>
  );
}
```

---

## Context Dependencies

### Inter-Context Communication

1. **AuthContext → CartContext**:
   - CartContext listens to `user` state changes
   - On login: Loads user cart from backend and merges with guest cart
   - On logout: Clears cart and navigates to storefront

2. **CartContext → AuthContext**:
   - CartContext uses `checkAuth()` to initialize user state
   - CartContext accesses `user` for checkout validation and API calls

3. **CartContext → UIContext**:
   - Uses `setView()` to navigate on logout and checkout validation

4. **ProductContext → UIContext**:
   - Uses `searchInputRef` for focus management during search

5. **OrderContext → UIContext**:
   - Watches `view` state to trigger order/message fetching on admin view

6. **OrderContext → ProductContext**:
   - Calls `fetchProducts()` after order status changes to update stock

7. **OrderContext → MessageContext**:
   - Calls `fetchMessages()` when entering admin view

---

## Key Features

### Cart Management
- **Guest Cart**: Stored in localStorage, persists across sessions
- **User Cart**: Synced to backend with 500ms debounce
- **Cart Merge**: When guest logs in, guest cart merges with user cart
- **Stock Validation**: Prevents adding more items than available in stock

### Authentication Flow
1. User logs in → AuthContext sets user
2. CartContext detects user change → Saves guest cart
3. CartContext loads user cart from backend
4. CartContext merges guest cart with user cart
5. Guest cart in localStorage is cleared

### Search Functionality
- **Live Suggestions**: Debounced (300ms) API calls for suggestions
- **Category Filtering**: Search within selected category
- **Focus Management**: Maintains focus during suggestion updates

### Order Management
- **Admin View**: Fetches orders and messages on view change
- **Stock Updates**: Refetches products after order status changes
- **Delete Protection**: Only completed/cancelled orders can be deleted

---

## Best Practices

1. **Always use the custom hooks** (e.g., `useCart()`, `useAuth()`) instead of `useContext()` directly
2. **Error handling**: All contexts include try-catch blocks with user-friendly error messages
3. **Debouncing**: Cart sync (500ms) and search suggestions (300ms) are debounced
4. **Memoization**: Computed values like `cartTotal` and `categories` use `useMemo()`
5. **Type Safety**: All contexts have proper TypeScript interfaces

---

## Migration from index.tsx

To use these contexts in your existing components:

### Before (Props Drilling):
```tsx
function StorefrontView({
  user,
  products,
  cart,
  addToCart,
  setView,
  // ... 20 more props
}) {
  // component logic
}
```

### After (Context Hooks):
```tsx
import { useAuth, useProduct, useCart, useUI } from '@/contexts';

function StorefrontView() {
  const { user } = useAuth();
  const { products } = useProduct();
  const { cart, addToCart } = useCart();
  const { setView } = useUI();

  // component logic
}
```

---

## TypeScript Support

All contexts include full TypeScript support with:
- Interface definitions for context values
- Type-safe custom hooks
- Proper error handling with typed error messages
- JSDoc comments for complex functions

---

## Testing Considerations

When testing components that use these contexts:

```tsx
import { render } from '@testing-library/react';
import { AppProvider } from '@/contexts';

test('component renders correctly', () => {
  render(
    <AppProvider>
      <YourComponent />
    </AppProvider>
  );
});
```

For isolated testing, you can provide mock context values:

```tsx
import { CartContext } from '@/contexts/CartContext';

const mockCartValue = {
  cart: [],
  addToCart: jest.fn(),
  // ... other required properties
};

render(
  <CartContext.Provider value={mockCartValue}>
    <YourComponent />
  </CartContext.Provider>
);
```

---

## Performance Optimizations

1. **Debounced API Calls**: Cart sync (500ms), search suggestions (300ms)
2. **Memoized Computed Values**: `cartTotal`, `categories`
3. **Conditional Effects**: Effects only run when necessary (e.g., `!isInitialLoad`)
4. **Focused Re-renders**: Contexts are split to minimize unnecessary re-renders

---

## Future Enhancements

Potential improvements to consider:

1. **Persist Theme**: Save dark mode preference to localStorage
2. **Optimistic Updates**: Update UI before API response for better UX
3. **Error Boundaries**: Add error boundaries around each context provider
4. **Loading States**: Add global loading indicator context
5. **Notifications**: Create a toast/notification context for alerts
6. **Analytics**: Add analytics tracking context
7. **Internationalization**: Add i18n context for multi-language support

---

## Troubleshooting

### Common Issues

**Issue**: "useCart must be used within a CartProvider"
- **Solution**: Ensure your component is wrapped with `<AppProvider>`

**Issue**: Cart not syncing to backend
- **Solution**: Check that user is authenticated and API endpoints are accessible

**Issue**: Search suggestions not appearing
- **Solution**: Verify `searchTerm` is being set and API is returning results

**Issue**: Cart cleared unexpectedly
- **Solution**: Check if user logged out or 'cart-cleared' event was fired

---

## File Structure

```
contexts/
├── AppProvider.tsx        # Main provider wrapper
├── AuthContext.tsx        # Authentication management
├── CartContext.tsx        # Shopping cart management
├── MessageContext.tsx     # Customer messages
├── OrderContext.tsx       # Order management
├── ProductContext.tsx     # Product and search management
├── ThemeContext.tsx       # Theme management
├── UIContext.tsx          # UI state management
├── index.tsx             # Centralized exports
└── README.md             # This file
```

---

## Summary

This Context API architecture provides:
- ✅ **Decentralized State**: 7 focused contexts instead of one monolithic component
- ✅ **Type Safety**: Full TypeScript support throughout
- ✅ **Performance**: Debouncing, memoization, and optimized re-renders
- ✅ **Maintainability**: Clear separation of concerns and dependencies
- ✅ **Scalability**: Easy to add new contexts or extend existing ones
- ✅ **Developer Experience**: Custom hooks, JSDoc comments, and comprehensive documentation

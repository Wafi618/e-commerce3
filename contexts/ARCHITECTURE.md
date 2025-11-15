# Context Architecture Diagram

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AppProvider                              │
│  (Wraps entire application)                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ThemeProvider                               │
│  State: darkMode                                                 │
│  Functions: setDarkMode, toggleDarkMode                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        UIProvider                                │
│  State: view, isMounted, searchInputRef                          │
│  Functions: setView                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MessageProvider                              │
│  State: messages, showMessageModal                               │
│  Functions: fetchMessages, setMessages, setShowMessageModal      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AuthProvider                                │
│  State: user, showAuthModal, authMode                            │
│  Functions: checkAuth, handleLogin, handleRegister, handleLogout │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CartProvider                                │
│  Depends on: AuthProvider (user), UIProvider (setView)           │
│  State: cart, checkoutLoading, addressData, showAddressModal     │
│  Functions: addToCart, removeFromCart, updateQuantity,           │
│             handleCheckout, proceedToPayment, syncCartToBackend  │
│  Computed: cartTotal                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ProductProvider                              │
│  Depends on: UIProvider (searchInputRef)                         │
│  State: products, loading, error, selectedCategory,              │
│         searchTerm, searchQuery, searchSuggestions,              │
│         editingProduct, showProductModal                         │
│  Functions: fetchProducts, fetchSearchSuggestions,               │
│             saveProduct, deleteProduct                           │
│  Computed: categories                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OrderProvider                               │
│  Depends on: UIProvider (view), ProductProvider (fetchProducts), │
│              MessageProvider (fetchMessages)                     │
│  State: orders, myOrders, showOrderDetailsModal, selectedOrder   │
│  Functions: fetchOrders, updateOrderStatus, deleteOrder          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Your App Components                         │
│  (StorefrontView, CartView, AdminView, etc.)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Dependency Graph

```
ThemeProvider
    ↓ (independent)

UIProvider
    ↓ (independent)

MessageProvider
    ↓ (independent)

AuthProvider
    ↓ (independent, but watched by CartProvider)

CartProvider
    ├── uses AuthProvider.user
    ├── uses AuthProvider.checkAuth()
    └── uses UIProvider.setView
    ↓

ProductProvider
    └── uses UIProvider.searchInputRef
    ↓

OrderProvider
    ├── uses UIProvider.view
    ├── uses ProductProvider.fetchProducts()
    └── uses MessageProvider.fetchMessages()
```

## Data Flow Diagrams

### Authentication Flow

```
User enters credentials
        ↓
   handleLogin()
   (AuthContext)
        ↓
   Sets user state
        ↓
   CartContext detects
   user change
        ↓
   Saves guest cart
   from localStorage
        ↓
   Loads user cart
   from backend
        ↓
   Merges guest cart
   with user cart
        ↓
   Syncs merged cart
   to backend
        ↓
   Clears localStorage
        ↓
   User cart is active
```

### Logout Flow

```
User clicks logout
        ↓
   handleLogout()
   (AuthContext)
        ↓
   Calls /api/auth/logout
        ↓
   Sets user to null
        ↓
   CartContext detects
   user = null
        ↓
   Clears cart state
        ↓
   Navigates to storefront
   (UIContext.setView)
        ↓
   User logged out
```

### Add to Cart Flow (Guest)

```
User clicks "Add to Cart"
        ↓
   addToCart(product)
   (CartContext)
        ↓
   Validates stock
        ↓
   Updates cart state
        ↓
   useEffect detects
   cart change
        ↓
   No user → Save to
   localStorage
        ↓
   Cart persists
```

### Add to Cart Flow (Logged In)

```
User clicks "Add to Cart"
        ↓
   addToCart(product)
   (CartContext)
        ↓
   Validates stock
        ↓
   Updates cart state
        ↓
   useEffect detects
   cart change
        ↓
   User exists → Debounce
   500ms
        ↓
   syncCartToBackend()
        ↓
   POST /api/cart
        ↓
   Cart synced
```

### Checkout Flow

```
User clicks "Checkout"
        ↓
   handleCheckout()
   (CartContext)
        ↓
   Validates user profile
   (phone, city, address)
        ↓
   Profile incomplete?
        ↓
   Navigate to profile
   (UIContext.setView)
        ↓
   Profile complete?
        ↓
   Auto-fill address
   from user profile
        ↓
   Show address modal
        ↓
   User confirms/edits
   address
        ↓
   proceedToPayment()
        ↓
   Store cart & address
   in localStorage
        ↓
   POST /api/bkash/checkout
        ↓
   Redirect to bKash
        ↓
   Payment complete
        ↓
   Callback page clears
   cart via event
        ↓
   Done
```

### Product Search Flow

```
User types in search
        ↓
   setSearchTerm()
   (ProductContext)
        ↓
   useEffect detects change
        ↓
   Debounce 300ms
        ↓
   fetchSearchSuggestions()
        ↓
   GET /api/products?search=X
        ↓
   Update searchSuggestions
        ↓
   Show top 5 results
        ↓
   User selects suggestion
   or submits search
        ↓
   setSearchQuery()
        ↓
   useEffect detects change
        ↓
   fetchProducts()
        ↓
   GET /api/products?search=Y
        ↓
   Update products list
        ↓
   Display filtered products
```

### Admin Order Status Update Flow

```
Admin changes status
        ↓
   updateOrderStatus()
   (OrderContext)
        ↓
   PUT /api/orders/:id
   { status: newStatus }
        ↓
   API updates order
   and adjusts stock
        ↓
   fetchOrders()
   (refresh orders list)
        ↓
   fetchProducts()
   (ProductContext)
   (refresh stock display)
        ↓
   UI updates
```

## State Location Matrix

| State/Function | Context | Depends On | Used By |
|---------------|---------|------------|---------|
| darkMode | ThemeContext | - | StorefrontView, CartView, etc. |
| view | UIContext | - | All views, CartContext |
| searchInputRef | UIContext | - | ProductContext, SearchModal |
| user | AuthContext | - | CartContext, Views |
| showAuthModal | AuthContext | - | AuthModal |
| cart | CartContext | AuthContext | CartView, StorefrontView |
| cartTotal | CartContext | - | CartView, Checkout |
| addToCart | CartContext | - | StorefrontView, ProductCard |
| products | ProductContext | - | StorefrontView, AdminView |
| categories | ProductContext | - | StorefrontView |
| searchTerm | ProductContext | - | SearchModal |
| fetchProducts | ProductContext | - | OrderContext, AdminView |
| orders | OrderContext | - | AdminView |
| messages | MessageContext | - | AdminView |
| fetchMessages | MessageContext | - | OrderContext |

## Component Access Patterns

### View Components

```tsx
// StorefrontView
useAuth()      → user, logout
useProduct()   → products, categories, search
useCart()      → cart, addToCart
useUI()        → setView
useTheme()     → darkMode

// CartView
useCart()      → cart, total, checkout
useUI()        → setView
useTheme()     → darkMode

// AdminView
useProduct()   → products, CRUD operations
useOrder()     → orders, status updates
useMessage()   → messages
useAuth()      → user (admin check)
useUI()        → setView

// ProfileView
useAuth()      → user, setUser
useUI()        → setView
useTheme()     → darkMode

// MyOrdersView
useAuth()      → user
useUI()        → setView
useTheme()     → darkMode
```

### Modal Components

```tsx
// AuthModal
useAuth()      → login, register, modal state

// SearchModal
useProduct()   → search functions, suggestions
useTheme()     → darkMode
useUI()        → searchInputRef

// AddressModal
useCart()      → addressData, proceedToPayment
useUI()        → setView

// ProductModal
useProduct()   → saveProduct, editingProduct

// OrderDetailsModal
useOrder()     → selectedOrder

// MessageModal
useMessage()   → messages
useAuth()      → user
useTheme()     → darkMode
```

## Performance Characteristics

### Context Update Frequency

| Context | Update Frequency | Trigger |
|---------|-----------------|---------|
| ThemeContext | Low | Manual toggle |
| UIContext | Medium | View changes |
| MessageContext | Low | Admin view load |
| AuthContext | Low | Login/Logout |
| CartContext | High | Cart operations |
| ProductContext | Medium | Search, filters |
| OrderContext | Low | Admin actions |

### Optimization Strategies

1. **CartContext**: Debounced sync (500ms)
2. **ProductContext**: Debounced search (300ms)
3. **ProductContext**: Memoized categories
4. **CartContext**: Memoized cartTotal
5. **All Contexts**: Conditional useEffect execution

## Memory Footprint

Approximate state sizes:

- **ThemeContext**: ~1 KB (boolean + functions)
- **UIContext**: ~1 KB (string + ref)
- **MessageContext**: ~5-50 KB (message array)
- **AuthContext**: ~2 KB (user object)
- **CartContext**: ~10-100 KB (cart items + address)
- **ProductContext**: ~50-500 KB (product array)
- **OrderContext**: ~20-200 KB (order array)

**Total**: ~90-855 KB (depending on data size)

## API Endpoints Used

### AuthContext
- GET `/api/auth/me` - Check authentication
- POST `/api/auth/login` - Login
- POST `/api/auth/register` - Register
- POST `/api/auth/logout` - Logout

### CartContext
- GET `/api/cart` - Load cart
- POST `/api/cart` - Sync cart
- POST `/api/bkash/checkout` - Create payment

### ProductContext
- GET `/api/products` - Fetch products
- POST `/api/products` - Create product
- PUT `/api/products/:id` - Update product
- DELETE `/api/products/:id` - Delete product

### OrderContext
- GET `/api/orders` - Fetch orders
- PUT `/api/orders/:id` - Update status
- DELETE `/api/orders/delete` - Delete order

### MessageContext
- GET `/api/messages` - Fetch messages

## Error Handling Strategy

All contexts implement:
1. Try-catch blocks around async operations
2. User-friendly alert messages
3. Console error logging
4. State preservation on error (don't clear valid data)

Example:
```tsx
try {
  await fetch('/api/endpoint');
  // Update state on success
} catch (err) {
  alert('User-friendly message');
  console.error('Detailed error:', err);
  // Don't clear existing state
}
```

## Testing Strategy

### Unit Tests
- Test each context provider independently
- Mock dependencies (other contexts)
- Test state updates and side effects

### Integration Tests
- Test context interactions
- Test login → cart merge flow
- Test checkout flow
- Test admin operations

### E2E Tests
- Test complete user flows
- Test guest → user transition
- Test payment flow
- Test admin dashboard

## Future Enhancements

1. **Middleware Pattern**: Add action logging/analytics
2. **Undo/Redo**: Implement state history
3. **Optimistic Updates**: Update UI before API response
4. **Offline Support**: Add service worker caching
5. **Real-time Updates**: WebSocket integration
6. **State Persistence**: IndexedDB for offline cart
7. **Performance Monitoring**: Track render counts

## Comparison: Before vs After

### Before (Monolithic)
- 1 file: 758 lines
- 20+ state variables
- 30+ functions
- All logic in one component
- Props drilling through entire tree

### After (Context-based)
- 8 context files: ~1,400 lines total
- 7 focused domains
- Clear separation of concerns
- No props drilling
- Easy to test and maintain

### Benefits
- 📦 **Modular**: Each context is self-contained
- 🔧 **Maintainable**: Easy to find and fix bugs
- 🧪 **Testable**: Mock individual contexts
- 📈 **Scalable**: Add features without touching existing code
- 🎯 **Type-safe**: Full TypeScript support
- ⚡ **Performant**: Optimized re-renders

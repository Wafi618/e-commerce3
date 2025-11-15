# Context API Quick Reference

## Import All Hooks

```tsx
import {
  useTheme,
  useUI,
  useMessage,
  useAuth,
  useCart,
  useProduct,
  useOrder,
} from '@/contexts';
```

## Hook Reference

### useTheme()

```tsx
const { darkMode, setDarkMode, toggleDarkMode } = useTheme();

// Usage
setDarkMode(true);           // Set dark mode
toggleDarkMode();            // Toggle theme
```

### useUI()

```tsx
const { view, setView, isMounted, searchInputRef } = useUI();

// Usage
setView('storefront');       // Change view
setView('cart');            // Go to cart
setView('admin');           // Go to admin panel
setView('profile');         // Go to profile
setView('my-orders');       // Go to my orders
```

### useMessage()

```tsx
const {
  messages,
  setMessages,
  showMessageModal,
  setShowMessageModal,
  fetchMessages
} = useMessage();

// Usage
await fetchMessages();                    // Fetch messages
setShowMessageModal(true);               // Show modal
```

### useAuth()

```tsx
const {
  user,
  setUser,
  showAuthModal,
  setShowAuthModal,
  authMode,
  setAuthMode,
  checkAuth,
  handleLogin,
  handleRegister,
  handleLogout
} = useAuth();

// Usage
await checkAuth();                              // Check if authenticated
await handleLogin('email@example.com', 'pass'); // Login
await handleRegister('email', 'pass', 'name');  // Register
await handleLogout();                           // Logout
setShowAuthModal(true);                         // Show login modal
setAuthMode('login');                           // Set to login mode
setAuthMode('register');                        // Set to register mode
```

### useCart()

```tsx
const {
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
  syncCartToBackend,
  loadCartFromBackend,
  mergeGuestCartWithUserCart,
  cartTotal
} = useCart();

// Usage
addToCart(product);                    // Add product to cart
removeFromCart('product-id');          // Remove from cart
updateQuantity('product-id', 1);       // Increase quantity
updateQuantity('product-id', -1);      // Decrease quantity
handleCheckout();                      // Start checkout
await proceedToPayment();              // Process payment
await syncCartToBackend();             // Sync cart
await loadCartFromBackend();           // Load cart
await mergeGuestCartWithUserCart([]);  // Merge carts
console.log(cartTotal);                // Get total
```

### useProduct()

```tsx
const {
  products,
  setProducts,
  loading,
  setLoading,
  error,
  setError,
  selectedCategory,
  setSelectedCategory,
  searchTerm,
  setSearchTerm,
  searchQuery,
  setSearchQuery,
  searchSuggestions,
  setSearchSuggestions,
  showSuggestions,
  setShowSuggestions,
  showSearchModal,
  setShowSearchModal,
  editingProduct,
  setEditingProduct,
  showProductModal,
  setShowProductModal,
  fetchProducts,
  fetchSearchSuggestions,
  saveProduct,
  deleteProduct,
  categories
} = useProduct();

// Usage
await fetchProducts();                       // Fetch products
await fetchSearchSuggestions('query');       // Get suggestions
await saveProduct(productData);              // Create/update product
await deleteProduct('product-id');           // Delete product
setSelectedCategory('Electronics');          // Filter by category
setSearchTerm('laptop');                     // Set search input
setSearchQuery('laptop');                    // Apply search
setShowSearchModal(true);                    // Show search modal
setEditingProduct(product);                  // Edit product
setShowProductModal(true);                   // Show product form
console.log(categories);                     // Get all categories
```

### useOrder()

```tsx
const {
  orders,
  setOrders,
  myOrders,
  setMyOrders,
  showOrderDetailsModal,
  setShowOrderDetailsModal,
  selectedOrder,
  setSelectedOrder,
  fetchOrders,
  updateOrderStatus,
  deleteOrder
} = useOrder();

// Usage
await fetchOrders();                              // Fetch all orders
await updateOrderStatus('order-id', 'shipped');   // Update status
await deleteOrder('order-id', 'completed');       // Delete order
setSelectedOrder(order);                          // Select order
setShowOrderDetailsModal(true);                   // Show details
```

## Common Patterns

### Check Authentication

```tsx
const { user } = useAuth();

if (user) {
  // User is logged in
  console.log(user.name, user.email);
} else {
  // User is not logged in
}
```

### Admin Check

```tsx
const { user } = useAuth();

if (user?.role === 'admin') {
  // User is admin
}
```

### Add Product to Cart

```tsx
const { addToCart } = useCart();

const handleAddToCart = (product) => {
  addToCart(product); // Handles stock validation automatically
};
```

### Search Products

```tsx
const {
  searchTerm,
  setSearchTerm,
  setSearchQuery,
  searchSuggestions,
  showSuggestions
} = useProduct();

// As user types
const handleSearchInput = (e) => {
  setSearchTerm(e.target.value); // Updates suggestions
};

// When user submits search
const handleSearchSubmit = () => {
  setSearchQuery(searchTerm); // Fetches filtered products
};
```

### Theme Toggle

```tsx
const { darkMode, toggleDarkMode } = useTheme();

<button onClick={toggleDarkMode}>
  {darkMode ? '🌙 Dark' : '☀️ Light'}
</button>
```

### Navigate Between Views

```tsx
const { setView } = useUI();

<button onClick={() => setView('cart')}>Go to Cart</button>
<button onClick={() => setView('profile')}>Profile</button>
<button onClick={() => setView('admin')}>Admin</button>
```

### Checkout Flow

```tsx
const {
  cart,
  cartTotal,
  handleCheckout,
  addressData,
  setAddressData,
  proceedToPayment
} = useCart();

// Step 1: User clicks checkout
<button onClick={handleCheckout}>
  Checkout (${cartTotal})
</button>

// Step 2: User fills address (modal opens automatically)
<AddressModal
  addressData={addressData}
  setAddressData={setAddressData}
  proceedToPayment={proceedToPayment}
/>

// Step 3: proceedToPayment() redirects to bKash
```

### Product CRUD (Admin)

```tsx
const {
  products,
  setEditingProduct,
  setShowProductModal,
  saveProduct,
  deleteProduct
} = useProduct();

// Create new product
const handleCreate = () => {
  setEditingProduct(null);
  setShowProductModal(true);
};

// Edit product
const handleEdit = (product) => {
  setEditingProduct(product);
  setShowProductModal(true);
};

// Delete product
const handleDelete = async (id) => {
  await deleteProduct(id);
};

// Save product
const handleSave = async (productData) => {
  await saveProduct(productData);
};
```

### Order Management (Admin)

```tsx
const { orders, updateOrderStatus, deleteOrder } = useOrder();

// Update order status
await updateOrderStatus('order-123', 'shipped');
await updateOrderStatus('order-123', 'completed');
await updateOrderStatus('order-123', 'cancelled');

// Delete order (only completed/cancelled)
await deleteOrder('order-123', 'completed');
```

### Login/Register Flow

```tsx
const {
  showAuthModal,
  setShowAuthModal,
  authMode,
  setAuthMode,
  handleLogin,
  handleRegister
} = useAuth();

// Show login modal
const showLogin = () => {
  setAuthMode('login');
  setShowAuthModal(true);
};

// Show register modal
const showRegister = () => {
  setAuthMode('register');
  setShowAuthModal(true);
};

// Login
await handleLogin('email@example.com', 'password');

// Register
await handleRegister('email@example.com', 'password', 'John Doe');
```

### Display Cart Count (Badge)

```tsx
const { cart } = useCart();

const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

<span className="badge">{itemCount}</span>
```

### Filter Products by Category

```tsx
const {
  categories,
  selectedCategory,
  setSelectedCategory
} = useProduct();

<select
  value={selectedCategory}
  onChange={(e) => setSelectedCategory(e.target.value)}
>
  {categories.map(cat => (
    <option key={cat} value={cat}>{cat}</option>
  ))}
</select>
```

### Conditional Rendering Based on View

```tsx
const { view } = useUI();

{view === 'storefront' && <StorefrontView />}
{view === 'cart' && <CartView />}
{view === 'admin' && <AdminView />}
{view === 'profile' && <ProfileView />}
{view === 'my-orders' && <MyOrdersView />}
```

## TypeScript Types

### User
```tsx
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
}
```

### Product
```tsx
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  stock: number;
}
```

### CartItem
```tsx
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
  category?: string;
}
```

### Order
```tsx
interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  house?: string;
  floor?: string;
  notes?: string;
  items: any[];
  total: number;
  status: string;
  paymentId: string;
  createdAt: string;
}
```

### AddressData
```tsx
interface AddressData {
  phone: string;
  city: string;
  country: string;
  address: string;
  house: string;
  floor: string;
  notes: string;
}
```

### Message
```tsx
interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}
```

## Error Handling

All context functions include error handling. Errors are logged to console and shown to users via alerts.

```tsx
const { handleLogin } = useAuth();

// Login handles errors automatically
await handleLogin(email, password);
// Shows alert if login fails
// Logs error to console
```

## Performance Tips

1. **Destructure only what you need**:
   ```tsx
   // Good
   const { cart, addToCart } = useCart();

   // Avoid if you only need cart
   const allCartStuff = useCart();
   ```

2. **Use memo for expensive computations**:
   ```tsx
   const itemCount = useMemo(
     () => cart.reduce((sum, item) => sum + item.quantity, 0),
     [cart]
   );
   ```

3. **Don't call hooks conditionally**:
   ```tsx
   // Wrong
   if (user) {
     const { cart } = useCart();
   }

   // Correct
   const { cart } = useCart();
   if (user) {
     // use cart
   }
   ```

## Debugging

### Check Context Values

```tsx
const cart = useCart();
const auth = useAuth();
const product = useProduct();

console.log('Cart:', cart);
console.log('Auth:', auth);
console.log('Product:', product);
```

### Check if User is Authenticated

```tsx
const { user, checkAuth } = useAuth();

useEffect(() => {
  console.log('User:', user);
}, [user]);

// Manually check
const verify = async () => {
  const userData = await checkAuth();
  console.log('Verified user:', userData);
};
```

### Monitor Cart Changes

```tsx
const { cart } = useCart();

useEffect(() => {
  console.log('Cart updated:', cart);
}, [cart]);
```

## Best Practices

1. Always use the custom hooks (`useCart`, `useAuth`, etc.)
2. Don't call `useContext(CartContext)` directly
3. Keep hooks at the top level of your component
4. Use TypeScript for type safety
5. Destructure only the values you need
6. Let contexts handle side effects (API calls, localStorage)
7. Don't modify context state directly - use provided functions

## Common Mistakes to Avoid

1. ❌ Calling hooks inside conditions or loops
2. ❌ Using `useContext` instead of custom hooks
3. ❌ Modifying state directly: `cart.push(item)`
4. ❌ Forgetting to wrap app with `<AppProvider>`
5. ❌ Calling hooks in non-React functions

## Testing

```tsx
import { render } from '@testing-library/react';
import { AppProvider } from '@/contexts';

test('component uses cart', () => {
  render(
    <AppProvider>
      <YourComponent />
    </AppProvider>
  );
});
```

## Resources

- Full Documentation: `contexts/README.md`
- Migration Guide: `contexts/MIGRATION_GUIDE.md`
- Source Code: `contexts/*.tsx`

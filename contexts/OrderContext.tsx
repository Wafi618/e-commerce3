import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useProduct } from './ProductContext';
import { useMessage } from './MessageContext';

/**
 * Order Interface
 */
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
  status: 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled';
  paymentId: string;
  createdAt: string;
  // Additional properties for compatibility
  customer?: {
    name: string;
    email: string;
  };
  email?: string;
  date?: string;
  orderItems?: any[];
}

/**
 * Order Context Interface
 */
interface OrderContextValue {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  myOrders: Order[];
  setMyOrders: (orders: Order[]) => void;
  showOrderDetailsModal: boolean;
  setShowOrderDetailsModal: (show: boolean) => void;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
  deleteOrder: (orderId: string, orderStatus: string) => Promise<void>;
}

interface OrderProviderProps {
  children: ReactNode;
}

/**
 * Order Context
 * Manages order state and operations
 * Depends on: UIContext, ProductContext, MessageContext
 */
const OrderContext = createContext<OrderContextValue | undefined>(undefined);

/**
 * Order Provider Component
 * Provides order management functionality for admin and customer views
 */
export function OrderProvider({ children }: OrderProviderProps) {
  const { fetchProducts } = useProduct();
  const { fetchMessages } = useMessage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  /**
   * Fetches orders from API
   */
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  /**
   * Updates order status
   * @param orderId - Order ID to update
   * @param newStatus - New status value
   */
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchOrders();
        // Refetch products to update stock display after status change
        await fetchProducts();
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (err) {
      alert('Network error. Failed to update order.');
      console.error('Update order error:', err);
    }
  };

  /**
   * Deletes an order (only completed or cancelled orders)
   * @param orderId - Order ID to delete
   * @param orderStatus - Current order status
   */
  const deleteOrder = async (orderId: string, orderStatus: string) => {
    if (orderStatus !== 'completed' && orderStatus !== 'cancelled') {
      alert('Only completed or cancelled orders can be deleted');
      return;
    }

    if (!confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/orders/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchOrders();
        alert('Order deleted successfully');
      } else {
        alert(data.error || 'Failed to delete order');
      }
    } catch (err) {
      alert('Network error. Failed to delete order.');
      console.error('Delete order error:', err);
    }
  };

  // Orders are now fetched by the admin page when it mounts
  // This keeps the context simpler and follows Next.js patterns

  const value: OrderContextValue = {
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
    deleteOrder,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

/**
 * Custom hook to use Order context
 * @throws Error if used outside OrderProvider
 */
export function useOrder(): OrderContextValue {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}

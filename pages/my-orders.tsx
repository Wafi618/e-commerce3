import React, { useState, useEffect } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { getImageUrl } from '@/utils/imageUtils';
import { Badge } from '@/components/ui/Badge';
import { useAuth, useCart, useProduct, useTheme } from '@/contexts';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { products } = useProduct();
  const { reorder } = useCart();
  const [localOrders, setLocalOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const response = await fetch('/api/orders/my-orders');
        const data = await response.json();
        if (data.success) {
          setLocalOrders(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch my orders:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || 'Order cancelled successfully');
        setLocalOrders(localOrders.map(order =>
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        ));
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch (err) {
      alert('Network error. Failed to cancel order.');
      console.error('Cancel order error:', err);
    }
  };

  return (
    <Layout title="My Orders" showBackButton>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {localOrders.length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-12 text-center`}>
            <Package className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No orders yet</h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>Start shopping to see your orders here</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {localOrders.map(order => (
              <div key={order.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
                <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Order #{order.id}</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                        {order.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>৳{Number(order.total).toFixed(2)}</p>
                      <div className="flex gap-2 mt-2 justify-end">
                        <Badge status={order.status}>
                          {order.status.toUpperCase()}
                        </Badge>
                        <button
                          onClick={() => reorder(order, products)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                        >
                          <RefreshCw size={14} />
                          Reorder
                        </button>
                        {order.status !== 'shipping' && order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Order Items:</h4>
                  <div className="space-y-2">
                    {order.orderItems && order.orderItems.map((item: any, idx: number) => (
                      <div key={idx} className={`flex items-center justify-between ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded p-3`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded overflow-hidden flex items-center justify-center`}>
                            <img
                              src={getImageUrl(item.product.image) || 'https://via.placeholder.com/48?text=No+Image'}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/48?text=No+Image';
                              }}
                            />
                          </div>
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.product.name}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>৳{item.price} × {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>৳{(Number(item.price) * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

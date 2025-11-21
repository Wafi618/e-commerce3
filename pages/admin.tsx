import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, DollarSign, TrendingUp, CreditCard, Plus, Edit2, Trash2, MessageSquare, Key, Eye, EyeOff } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';
import { CustomersTab } from '@/components/admin/CustomersTab';
import { Badge } from '@/components/ui/Badge';
import { ProductModal } from '@/components/modals/ProductModal';
import { OrderDetailsModal } from '@/components/modals/OrderDetailsModal';
import { MessageModal } from '@/components/modals/MessageModal';
import { useAuth, useProduct, useOrder, useMessage, useTheme, useNotification } from '@/contexts';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

export default function AdminPage() {
  const { user } = useAuth();
  const {
    products,
    loading,
    setShowProductModal,
    setEditingProduct,
    deleteProduct,
    editingProduct,
    showProductModal,
    saveProduct
  } = useProduct();
  const {
    orders,
    updateOrderStatus,
    deleteOrder,
    setSelectedOrder,
    setShowOrderDetailsModal,
    showOrderDetailsModal,
    fetchOrders
  } = useOrder();
  const { messages, setShowMessageModal, showMessageModal, fetchMessages } = useMessage();
  const { addNotification, showConfirmation } = useNotification();

  // Admin panel always uses dark mode
  const darkMode = true;

  const [adminTab, setAdminTab] = useState('products');
  const [ordersSubTab, setOrdersSubTab] = useState('current');
  const [messagesSubTab, setMessagesSubTab] = useState('regular');
  const [showResetModal, setShowResetModal] = useState<any>(null);

  // Fetch data when admin page mounts
  useEffect(() => {
    fetchOrders();
    fetchMessages();
  }, []);

  const stats = {
    totalRevenue: orders
      .filter(o => o.status === 'shipping' || o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.total), 0),
    totalOrders: orders.length,
    totalProducts: products.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
  };

  const resetPassword = async (customerId: string, newPassword: string) => {
    try {
      const response = await fetch('/api/admin/get-customer-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        addNotification('Password reset successfully!', 'success');
        setShowResetModal(null);
      } else {
        addNotification(data.error || 'Failed to reset password', 'error');
      }
    } catch (err) {
      addNotification('Network error. Failed to reset password.', 'error');
    }
  };

  const toggleArchive = async (product: any) => {
    try {
      // We use the saveProduct function from context which calls the API
      // But saveProduct expects a full product object.
      // Alternatively, we can manually call the API here for a partial update if the API supported PATCH,
      // but our API is POST for create/update.
      // Let's reuse saveProduct but we need to make sure we pass all fields.

      // Actually, saveProduct in ProductContext handles create vs update based on ID.
      await saveProduct({
        ...product,
        isArchived: !product.isArchived
      });
      addNotification(product.isArchived ? 'Product unarchived' : 'Product archived', 'success');
    } catch (error) {
      console.error(error);
      addNotification('Failed to update archive status', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Notification Containers */}
      <ToastContainer />
      <ConfirmModal />

      <nav className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-white">Admin Dashboard</span>
            </div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700"
            >
              View Storefront →
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8 overflow-x-auto">
          <button
            onClick={() => setAdminTab('overview')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${adminTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setAdminTab('products')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${adminTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            Products
          </button>
          <button
            onClick={() => setAdminTab('orders')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${adminTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            Orders
          </button>
          <button
            onClick={() => setAdminTab('messages')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${adminTab === 'messages' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            Messages
          </button>
          <button
            onClick={() => setAdminTab('customers')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${adminTab === 'customers' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            Customers
          </button>
        </div>

        {adminTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Total Revenue</span>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-white">৳{Number(stats.totalRevenue).toFixed(2)}</div>
              </div>
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Total Orders</span>
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-white">{stats.totalOrders}</div>
              </div>
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Products</span>
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-white">{stats.totalProducts}</div>
              </div>
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Pending Orders</span>
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-white">{stats.pendingOrders}</div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Orders</h2>
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                    <div>
                      <div className="font-semibold text-white">{(order as any).customer || 'N/A'}</div>
                      <div className="text-sm text-gray-400">{(order as any).email || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">৳{Number(order.total).toFixed(2)}</div>
                      <Badge status={order.status}>{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Products Management</h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductModal(true);
                }}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="text-center py-12 bg-gray-800 rounded-lg shadow">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No products yet. Add your first product!</p>
              </div>
            )}

            {!loading && products.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700 border-b border-gray-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">Product</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">Category</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">Subcategory</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">Price</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">Stock</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {products.map(product => (
                        <tr key={product.id} className={`hover:bg-gray-700 ${(product as any).isArchived ? 'opacity-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img
                                  src={getImageUrl(product.image) || 'https://via.placeholder.com/40?text=No+Image'}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/40?text=No+Image';
                                  }}
                                />
                              </div>
                              <span className="font-medium text-white">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{product.category}</td>
                          <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{(product as any).subcategory || '-'}</td>
                          <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">৳{product.price}</td>
                          <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{product.stock}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleArchive(product)}
                                disabled={loading}
                                className="p-2 text-gray-400 hover:bg-gray-600 rounded disabled:opacity-50"
                                title={(product as any).isArchived ? "Unarchive" : "Archive"}
                              >
                                {(product as any).isArchived ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setShowProductModal(true);
                                }}
                                disabled={loading}
                                className="p-2 text-blue-400 hover:bg-gray-600 rounded disabled:opacity-50"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  showConfirmation(
                                    'Delete Product',
                                    `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
                                    () => deleteProduct(product.id)
                                  )
                                }
                                disabled={loading}
                                className="p-2 text-red-400 hover:bg-gray-600 rounded disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {adminTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Orders Management</h2>

            {orders.length === 0 ? (
              <div className="bg-gray-800 rounded-lg shadow p-12 text-center">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No orders yet</h3>
                <p className="text-gray-400">Orders will appear here once customers make purchases</p>
              </div>
            ) : (
              <div>
                {/* Subtabs for Current/Past Orders */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setOrdersSubTab('current')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${ordersSubTab === 'current' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                  >
                    Current Orders
                  </button>
                  <button
                    onClick={() => setOrdersSubTab('past')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${ordersSubTab === 'past' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                  >
                    Past Orders
                  </button>
                </div>

                {/* Current Orders */}
                {ordersSubTab === 'current' && (
                  <div className="space-y-4">
                    {orders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'shipping').length === 0 ? (
                      <div className="bg-gray-800 rounded-lg shadow p-12 text-center">
                        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No current orders</h3>
                        <p className="text-gray-400">Active orders will appear here</p>
                      </div>
                    ) : (
                      orders
                        .filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'shipping')
                        .map(order => (
                          <div key={order.id} className="bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="p-6 border-b border-gray-700">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-semibold text-white">Order #{order.id}</h3>
                                  <p className="text-sm text-gray-400 mt-1">
                                    {(order as any).customer || 'N/A'} • {(order as any).email || 'N/A'}
                                  </p>
                                  <p className="text-sm text-gray-400">{order.date || new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-white">৳{Number(order.total).toFixed(2)}</p>
                                  <div className="flex gap-2 mt-2 justify-end">
                                    <select
                                      value={order.status}
                                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                      className={`px-3 py-1 rounded text-sm font-medium border-0 ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        order.status === 'shipping' ? 'bg-purple-100 text-purple-800' :
                                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                              'bg-yellow-100 text-yellow-800'
                                        }`}
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="processing">Processing</option>
                                      <option value="shipping">Shipping</option>
                                      <option value="completed">Completed</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                    <button
                                      onClick={() => {
                                        setSelectedOrder(order);
                                        setShowOrderDetailsModal(true);
                                      }}
                                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                    >
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-6 bg-gray-700">
                              <h4 className="text-sm font-semibold text-white mb-3">Order Items:</h4>
                              <div className="space-y-2">
                                {order.orderItems && order.orderItems.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between bg-gray-800 rounded p-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-gray-700 rounded overflow-hidden flex items-center justify-center">
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
                                        <p className="font-medium text-white">{item.product.name}</p>
                                        <p className="text-sm text-gray-400">৳{item.price} × {item.quantity}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-white">৳{(Number(item.price) * item.quantity).toFixed(2)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {/* Past Orders */}
                {ordersSubTab === 'past' && (
                  <div className="space-y-4">
                    {orders.filter(o => o.status === 'completed' || o.status === 'cancelled').length === 0 ? (
                      <div className="bg-gray-800 rounded-lg shadow p-12 text-center">
                        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No past orders</h3>
                        <p className="text-gray-400">Completed and cancelled orders will appear here</p>
                      </div>
                    ) : (
                      orders
                        .filter(o => o.status === 'completed' || o.status === 'cancelled')
                        .map(order => (
                          <div key={order.id} className="bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="p-6 border-b border-gray-700">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-semibold text-white">Order #{order.id}</h3>
                                  <p className="text-sm text-gray-400 mt-1">
                                    {(order as any).customer || 'N/A'} • {(order as any).email || 'N/A'}
                                  </p>
                                  <p className="text-sm text-gray-400">{order.date || new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-white">৳{Number(order.total).toFixed(2)}</p>
                                  <div className="flex gap-2 mt-2 justify-end flex-wrap">
                                    <select
                                      value={order.status}
                                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                      className={`px-3 py-1 rounded text-sm font-medium border-0 ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        order.status === 'shipping' ? 'bg-purple-100 text-purple-800' :
                                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                              'bg-yellow-100 text-yellow-800'
                                        }`}
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="processing">Processing</option>
                                      <option value="shipping">Shipping</option>
                                      <option value="completed">Completed</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                    <button
                                      onClick={() => {
                                        setSelectedOrder(order);
                                        setShowOrderDetailsModal(true);
                                      }}
                                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                    >
                                      View Details
                                    </button>
                                    <button
                                      onClick={() => deleteOrder(order.id, order.status)}
                                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                      title="Permanently delete order"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-6 bg-gray-700">
                              <h4 className="text-sm font-semibold text-white mb-3">Order Items:</h4>
                              <div className="space-y-2">
                                {order.orderItems && order.orderItems.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between bg-gray-800 rounded p-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-gray-700 rounded overflow-hidden flex items-center justify-center">
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
                                        <p className="font-medium text-white">{item.product.name}</p>
                                        <p className="text-sm text-gray-400">৳{item.price} × {item.quantity}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-white">৳{(Number(item.price) * item.quantity).toFixed(2)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {adminTab === 'messages' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Messages</h2>
              <button
                onClick={() => setShowMessageModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                New Message
              </button>
            </div>

            {/* Subtabs for Regular Messages and Password Reset Requests */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMessagesSubTab('regular')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${messagesSubTab === 'regular' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
              >
                Regular Messages
              </button>
              <button
                onClick={() => setMessagesSubTab('password-resets')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${messagesSubTab === 'password-resets' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
              >
                Password Reset Requests
              </button>
            </div>

            {/* Regular Messages */}
            {messagesSubTab === 'regular' && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Regular Messages (10 most recent)</h3>
                {messages.filter((msg: any) => !msg.isPasswordReset).length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400">No regular messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages
                      .filter((msg: any) => !msg.isPasswordReset)
                      .slice(0, 10)
                      .map((msg: any) => {
                        const isSent = msg.senderId === user?.id;
                        return (
                          <div key={msg.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {isSent ? `To: ${msg.receiver.name || msg.receiver.email}` : `From: ${msg.sender.name || msg.sender.email}`}
                                </p>
                                {msg.subject && (
                                  <p className="text-sm text-gray-300">Subject: {msg.subject}</p>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-300">{msg.message}</p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Password Reset Requests */}
            {messagesSubTab === 'password-resets' && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Password Reset Requests</h3>
                {messages.filter((msg: any) => msg.isPasswordReset).length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400">No password reset requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages
                      .filter((msg: any) => msg.isPasswordReset)
                      .map((msg: any) => {
                        return (
                          <div key={msg.id} className="bg-orange-900 rounded-lg p-4 border border-orange-700">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">
                                  From: {msg.sender.name || msg.sender.email}
                                </p>
                                {msg.subject && (
                                  <p className="text-sm font-semibold text-orange-400">Subject: {msg.subject}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString()}
                                </span>
                                <button
                                  onClick={() => setShowResetModal(msg.sender)}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm font-medium"
                                  title="Reset password for this user"
                                >
                                  <Key className="w-4 h-4" />
                                  Reset Password
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-300 whitespace-pre-line">{msg.message}</p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {adminTab === 'customers' && <CustomersTab />}
      </div>

      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onSave={saveProduct}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          loading={loading}
        />
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Reset Password</h3>
            <p className="text-sm text-gray-300 mb-4">
              Reset password for: <strong>{showResetModal.email}</strong>
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newPassword = formData.get('newPassword') as string;
                if (newPassword) {
                  resetPassword(showResetModal.id, newPassword);
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  name="newPassword"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetailsModal && <OrderDetailsModal />}

      {/* Message Modal */}
      {showMessageModal && <MessageModal />}
    </div>
  );
}

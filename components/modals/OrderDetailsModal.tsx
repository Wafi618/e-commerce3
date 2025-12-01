import React from 'react';
import { getImageUrl } from '@/utils/imageUtils';
import { useOrder } from '@/contexts';

export const OrderDetailsModal: React.FC = () => {
  // Consume contexts directly
  const { selectedOrder, setShowOrderDetailsModal } = useOrder();
  if (!selectedOrder) return null;

  // Admin modals use dark mode
  const darkMode = true;

  // Type assertion to handle API response structure
  const order = selectedOrder as any;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Order Details - #{order.id}
          </h3>
          <button
            onClick={() => setShowOrderDetailsModal(false)}
            className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            ✕
          </button>
        </div>

        {/* Customer Info */}
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 mb-4`}>
          <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Customer Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name:</span>
              <span className={`ml-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{order.customer || 'N/A'}</span>
            </div>
            <div>
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email:</span>
              <span className={`ml-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{order.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Manual Payment Info */}
        {order.paymentMethod === 'MANUAL_BKASH' && (
          <div
            className={`bg-yellow-900 border border-yellow-700 rounded-lg p-4 mb-4`}
          >
            <h4 className={`font-semibold text-yellow-300 mb-2`}>
              Manual Payment Verification
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className={`text-gray-400`}>Payment Method:</span>
                <span className={`ml-2 text-white`}>MANUAL_BKASH</span>
              </div>
              <div>
                <span className={`text-gray-400`}>Status:</span>
                <span className={`ml-2 text-white`}>{order.status}</span>
              </div>
              <div>
                <span className={`text-gray-400`}>Amount:</span>
                <span className={`ml-2 text-white`}>
                  ৳{Number(order.total).toFixed(2)}
                </span>
              </div>
              <div>
                <span className={`text-gray-400`}>User bKash #:</span>
                <span className={`ml-2 text-white`}>
                  {order.paymentPhoneNumber}
                </span>
              </div>
              <div className="col-span-2">
                <span className={`text-gray-400`}>User TrxID:</span>
                <span className={`ml-2 text-white`}>{order.paymentTrxId}</span>
              </div>
            </div>
            <p className="text-yellow-400 text-xs mt-3">
              Admin must manually verify this payment in the bKash account
              (01752983864) before changing status to 'Processing'.
            </p>
          </div>
        )}

        {/* Delivery Address */}
        {(order.phone || order.address) && (
          <div className={`${darkMode ? 'bg-blue-900 border border-blue-700' : 'bg-blue-50'} rounded-lg p-4 mb-4`}>
            <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Delivery Address</h4>
            <div className="space-y-1 text-sm">
              {order.phone && (
                <p><span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Phone:</span> <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{order.phone}</span></p>
              )}
              {order.address && (
                <p><span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Street:</span> <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{order.address}</span></p>
              )}
              {order.house && (
                <p><span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>House/Building:</span> <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{order.house}</span></p>
              )}
              {order.floor && (
                <p><span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Floor/Unit:</span> <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{order.floor}</span></p>
              )}
              {order.city && (
                <p><span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>City:</span> <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{order.city}</span></p>
              )}
              {order.country && (
                <p><span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Country:</span> <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{order.country}</span></p>
              )}
              {order.notes && (
                <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-blue-700' : 'border-blue-200'}`}>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Additional Notes:</p>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'} italic`}>{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="mb-4">
          <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Order Items</h4>
          <div className="space-y-2">
            {order.orderItems && order.orderItems.map((item: any, idx: number) => (
              <div key={idx} className={`flex items-center justify-between ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded p-3`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded overflow-hidden`}>
                    <img
                      src={getImageUrl(item.product.image)}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.product.name}</p>
                    {item.selectedOptions && (
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </div>
                    )}
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

        {/* Total */}
        <div className={`border-t ${darkMode ? 'border-gray-700' : ''} pt-4`}>
          <div className="flex justify-between items-center">
            <span className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total Amount:</span>
            <span className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>৳{Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={() => setShowOrderDetailsModal(false)}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ShoppingCart, CreditCard } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { getImageUrl } from '@/utils/imageUtils';
import { useCart, useTheme } from '@/contexts';
import Link from 'next/link';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    handleCheckout,
    checkoutLoading,
  } = useCart();
  const { darkMode } = useTheme();

  return (
    <Layout title="Shopping Cart" showBackButton>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
            <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Your cart is empty</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>Add some products to get started!</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 flex items-center gap-4`}>
                <div className={`w-20 h-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg flex items-center justify-center overflow-hidden`}>
                  <img
                    src={getImageUrl(item.image) || 'https://via.placeholder.com/80?text=No+Image'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Image';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>৳{Number(item.price).toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} flex items-center justify-center`}
                  >
                    -
                  </button>
                  <span className={`w-8 text-center font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} flex items-center justify-center`}
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ৳{(Number(item.price) * item.quantity).toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <div className="flex justify-between items-center mb-4">
                <span className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
                <span className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>৳{Number(cartTotal).toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5" />
                {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

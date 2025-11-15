import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Package } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { getImageUrl } from '@/utils/imageUtils';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { useAuth, useCart, useProduct, useTheme } from '@/contexts';

// Modals
import { MessageModal } from '@/components/modals/MessageModal';
import { SearchModal } from '@/components/modals/SearchModal';
import { AddressModal } from '@/components/modals/AddressModal';
import { AuthModal } from '@/components/modals/AuthModal';
import { OrderDetailsModal } from '@/components/modals/OrderDetailsModal';

// Import contexts to check modal visibility
import { useOrder, useMessage } from '@/contexts';

export default function HomePage() {
  const { showAuthModal } = useAuth();
  const { addToCart, showAddressModal } = useCart();
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    setShowSearchModal,
    showSearchModal,
    loading,
    error
  } = useProduct();
  const { darkMode } = useTheme();
  const { showOrderDetailsModal } = useOrder();
  const { showMessageModal } = useMessage();
  const [animatingProductId, setAnimatingProductId] = useState<string | null>(null);

  const handleAddToCart = (product: any) => {
    setAnimatingProductId(product.id);
    addToCart(product);
    setTimeout(() => {
      setAnimatingProductId(null);
    }, 600); // Animation duration
  };

  return (
    <Layout>
      <div className="relative">
        <ParticlesBackground darkMode={darkMode} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Discover Amazing Products</h1>

            {/* Search Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-white hover:bg-gray-50 text-gray-700'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} transition-colors flex items-center gap-2`}
              title="Search Products"
            >
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className={`mb-6 ${darkMode ? 'bg-red-900/50 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg`}>
            {error}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <Package className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
            <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No products found</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try adjusting your search or filters.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow ${animatingProductId === product.id ? 'product-added' : ''}`}>
                {/* Clickable product image and name - takes to detail page */}
                <Link href={`/product/${product.id}`}>
                  <div className={`h-48 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center overflow-hidden cursor-pointer`}>
                    <img
                      src={getImageUrl(product.image) || 'https://via.placeholder.com/300x200?text=No+Image'}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/product/${product.id}`}>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'} mb-1 cursor-pointer transition-colors`}>
                      {product.name}
                    </h3>
                  </Link>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>{product.category}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>৳{Number(product.price).toFixed(2)}</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.stock} in stock</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/product/${product.id}`} className="flex-1">
                      <button
                        className={`w-full py-2 rounded-lg transition-colors ${
                          darkMode
                            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        View Details
                      </button>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.stock <= 0}
                      className={`flex-1 py-2 rounded-lg transition-colors ${
                        product.stock <= 0
                          ? darkMode
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Modals */}
      {showAuthModal && <AuthModal />}
      {showSearchModal && <SearchModal />}
      {showAddressModal && <AddressModal />}
      {showOrderDetailsModal && <OrderDetailsModal />}
      {showMessageModal && <MessageModal />}
    </Layout>
  );
}

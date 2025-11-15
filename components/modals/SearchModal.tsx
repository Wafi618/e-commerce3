import React from 'react';
import { Search } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';
import { useProduct, useTheme, useUI } from '@/contexts';

export const SearchModal: React.FC = () => {
  // Consume contexts directly
  const {
    searchTerm,
    setSearchTerm,
    searchQuery,
    setSearchQuery,
    searchSuggestions,
    showSuggestions,
    setShowSuggestions,
    setShowSearchModal
  } = useProduct();
  const { darkMode } = useTheme();
  const { searchInputRef } = useUI();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Search Products
          </h3>
          <button
            onClick={() => setShowSearchModal(false)}
            className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            ✕
          </button>
        </div>

        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products... (Press Enter to search)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchQuery(searchTerm);
                setShowSuggestions(false);
                setShowSearchModal(false);
              }
            }}
            onFocus={() => {
              if (searchTerm && searchSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            autoFocus
            autoComplete="off"
            className={`w-full pl-10 pr-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />

          {/* Search Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className={`mt-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg max-h-96 overflow-y-auto`}>
              {searchSuggestions.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    setSearchTerm(product.name);
                    setSearchQuery(product.name);
                    setShowSuggestions(false);
                    setShowSearchModal(false);
                  }}
                  className={`p-3 cursor-pointer ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} flex items-center gap-3 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'} last:border-b-0`}
                >
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.name}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ৳{Number(product.price).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

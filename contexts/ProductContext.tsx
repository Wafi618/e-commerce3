import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useUI } from './UIContext';

/**
 * Product Interface
 */
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  stock: number;
}

/**
 * Product Context Interface
 */
interface ProductContextValue {
  products: Product[];
  setProducts: (products: Product[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchSuggestions: Product[];
  setSearchSuggestions: (products: Product[]) => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  showSearchModal: boolean;
  setShowSearchModal: (show: boolean) => void;
  editingProduct: Product | null;
  setEditingProduct: (product: Product | null) => void;
  showProductModal: boolean;
  setShowProductModal: (show: boolean) => void;
  fetchProducts: () => Promise<void>;
  fetchSearchSuggestions: (query: string) => Promise<void>;
  saveProduct: (product: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  categories: string[];
}

interface ProductProviderProps {
  children: ReactNode;
}

/**
 * Product Context
 * Manages product state, search, and CRUD operations
 * Depends on: UIContext
 */
const ProductContext = createContext<ProductContextValue | undefined>(undefined);

/**
 * Product Provider Component
 * Provides product management functionality including search and filtering
 */
export function ProductProvider({ children }: ProductProviderProps) {
  const { searchInputRef } = useUI();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  /**
   * Fetches products from API based on category and search filters
   */
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        setError(data.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches search suggestions based on user input
   * @param query - Search query string
   */
  const fetchSearchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('search', query);
      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSearchSuggestions(data.data.slice(0, 5)); // Show top 5 suggestions
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  };

  /**
   * Saves (creates or updates) a product
   * @param product - Product data to save
   */
  const saveProduct = async (product: any) => {
    setLoading(true);
    try {
      const isEditing = editingProduct !== null;
      const url = isEditing ? `/api/products/${product.id}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      const data = await response.json();

      if (data.success) {
        await fetchProducts();
        setShowProductModal(false);
        setEditingProduct(null);
      } else {
        alert(data.error || 'Failed to save product');
      }
    } catch (err) {
      alert('Network error. Failed to save product.');
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes a product
   * @param id - Product ID to delete
   */
  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchProducts();
      } else {
        alert(data.error || 'Failed to delete product');
      }
    } catch (err) {
      alert('Network error. Failed to delete product.');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get unique categories from products (memoized to prevent re-renders)
   */
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  // Fetch products on mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  // Fetch search suggestions as user types (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSearchSuggestions(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory]);

  // Restore focus if it was lost during suggestion updates
  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [searchSuggestions]);

  const value: ProductContextValue = {
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
    categories,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

/**
 * Custom hook to use Product context
 * @throws Error if used outside ProductProvider
 */
export function useProduct(): ProductContextValue {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}

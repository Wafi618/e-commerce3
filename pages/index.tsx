import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { Search, Package } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { getImageUrl } from '@/utils/imageUtils';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { ProductImage } from '@/components/ui/ProductImage';
import { useCart, useProduct, useTheme } from '@/contexts';
import { prisma } from '@/lib/prisma';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from './api/auth/[...nextauth]';

import { NextApiRequest, NextApiResponse } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const session = await getServerSession(
      context.req as unknown as NextApiRequest,
      context.res as unknown as NextApiResponse,
      getAuthOptions(context.req as unknown as NextApiRequest, context.res as unknown as NextApiResponse)
    );
    const isAdmin = session?.user?.role === 'ADMIN';

    const where: any = {};
    if (!isAdmin) {
      where.isArchived = false;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: isAdmin ? [
        { isArchived: 'asc' },
        { createdAt: 'desc' }
      ] : { createdAt: 'desc' },
      include: {
        options: {
          include: {
            values: true
          }
        }
      }
    });

    // Serialize Decimal to string/number for JSON
    const serializedProducts = products.map(p => ({
      ...p,
      price: Number(p.price),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return {
      props: {
        products: serializedProducts,
      },
    };
  } catch (error) {
    console.error('SSR Error:', error);
    return {
      props: {
        products: [],
      },
    };
  }
};

export default function HomePage() {
  const { addToCart } = useCart();
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    subcategories,
    selectedSubcategory,
    setSelectedSubcategory,
    setShowSearchModal,
    loading,
    error
  } = useProduct();
  const { darkMode } = useTheme();
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
      <Head>
        <title>Star Accessories | Premium Fashion & Accessories in Bangladesh</title>
        <meta name="description" content="Shop the best collection of fashion accessories, gadgets, and lifestyle products in Bangladesh. Premium quality, fast delivery, and excellent customer service." />
        <meta property="og:title" content="Star Accessories | Premium Fashion & Accessories" />
        <meta property="og:description" content="Shop the best collection of fashion accessories, gadgets, and lifestyle products in Bangladesh." />
        <meta property="og:type" content="website" />
      </Head>
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
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${selectedCategory === cat
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

            {/* Subcategories */}
            {selectedCategory !== 'All' && subcategories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
                {subcategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${selectedSubcategory === sub
                      ? 'bg-blue-500 text-white'
                      : darkMode
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
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
                    <div className={`h-48 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center overflow-hidden cursor-pointer relative`}>
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full"
                        options={(product as any).options}
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
                          className={`w-full py-2 rounded-lg transition-colors btn-glass ${darkMode
                            ? 'text-gray-200 hover:bg-white/10'
                            : 'text-gray-700 hover:bg-black/5'
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
                        className={`flex-1 py-2 rounded-lg transition-colors btn-glass ${product.stock <= 0
                          ? darkMode
                            ? 'text-gray-500 cursor-not-allowed'
                            : 'text-gray-500 cursor-not-allowed'
                          : 'text-white bg-blue-600/80 hover:bg-blue-600'
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
    </Layout>
  );
}

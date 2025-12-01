import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { ArrowLeft, ShoppingCart, Package, AlertCircle, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { getImageUrl } from '@/utils/imageUtils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { useCart, useTheme } from '@/contexts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { prisma } from '@/lib/prisma';
import { ReviewList } from '@/components/reviews/ReviewList';

interface OptionValue {
  id: string;
  name: string;
  image?: string;
}

interface ProductOption {
  id: string;
  name: string;
  values: OptionValue[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  images: string[];
  stock: number;
  category: string;
  subcategory?: string;
  description?: string;
  isArchived?: boolean;
  options: ProductOption[];
}

interface ProductDetailData {
  product: Product;
  similarProducts: Product[];
}

interface ProductPageProps {
  initialData: ProductDetailData | null;
  error?: string;
}

export default function ProductDetailPage({ initialData, error }: ProductPageProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { darkMode } = useTheme();

  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Initialize state from props
  useEffect(() => {
    if (initialData?.product) {
      let initialImage = initialData.product.image;

      // Fallback logic if main image is missing
      if (!initialImage || initialImage.trim() === '') {
        const optionWithImage = initialData.product.options?.find(opt => 
          opt.values.some(val => val.image && val.image.trim() !== '')
        );
        if (optionWithImage) {
          const valueWithImage = optionWithImage.values.find(val => val.image && val.image.trim() !== '');
          if (valueWithImage) {
            initialImage = valueWithImage.image || '';
          }
        }
      }
      
      setSelectedImage(initialImage);
      
      // Initialize default options
      if (initialData.product.options && initialData.product.options.length > 0) {
        const defaults: Record<string, string> = {};
        initialData.product.options.forEach(opt => {
          if (opt.values.length > 0) {
            defaults[opt.name] = opt.values[0].name;
          }
        });
        setSelectedOptions(defaults);
      }
    }
  }, [initialData]);

  if (router.isFallback) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner darkMode={darkMode} message="Loading product..." />
        </div>
      </Layout>
    );
  }

  if (error || !initialData) {
    return (
      <Layout>
        <Head>
          <title>Product Not Found | Star Accessories</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`${darkMode ? 'bg-red-900/50 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'} border px-6 py-4 rounded-lg flex items-center gap-3`}>
            <AlertCircle className="w-5 h-5" />
            <span>{error || 'Product not found'}</span>
          </div>
          <Link
            href="/"
            className={`mt-4 inline-flex items-center gap-2 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </Layout>
    );
  }

  const { product, similarProducts } = initialData;
  const allImages = [product.image, ...(product.images || [])].filter(Boolean);

  const handleAddToCart = () => {
    // Check if all options are selected
    if (product.options && product.options.length > 0) {
      const missingOptions = product.options.filter(opt => !selectedOptions[opt.name]);
      if (missingOptions.length > 0) {
        alert(`Please select ${missingOptions.map(o => o.name).join(', ')}`);
        return;
      }
    }

    addToCart({ ...product, selectedOptions }, quantity);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentIndex = allImages.indexOf(selectedImage);
    const nextIndex = (currentIndex + 1) % allImages.length;
    setSelectedImage(allImages[nextIndex]);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentIndex = allImages.indexOf(selectedImage);
    const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    setSelectedImage(allImages[prevIndex]);
  };

  const handleOptionChange = (optionName: string, value: string, image?: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
    if (image) {
      setSelectedImage(image);
    }
  };

  // JSON-LD Structured Data
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": allImages.map(img => getImageUrl(img)),
    "description": product.description || `Buy ${product.name} at Star Accessories.`,
    "sku": product.id.toString(),
    "offers": {
      "@type": "Offer",
      "url": `https://starxessories.cc/product/${product.id}`, // Replace with actual domain
      "priceCurrency": "BDT",
      "price": product.price,
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  return (
    <Layout>
      <Head>
        <title>{`${product.name} | Star Accessories`}</title>
        <meta name="description" content={product.description?.slice(0, 160) || `Buy ${product.name} - Best price in Bangladesh.`} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description?.slice(0, 160)} />
        <meta property="og:image" content={getImageUrl(product.image)} />
        <meta property="og:type" content="product" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      </Head>

      <div className="relative">
        <ParticlesBackground darkMode={darkMode} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href="/"
            className={`inline-flex items-center gap-2 mb-6 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Image Gallery */}
            <div>
              {/* Main Image */}
              <div
                className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg overflow-hidden mb-4 relative group cursor-pointer`}
                onClick={() => setShowLightbox(true)}
              >
                <img
                  src={getImageUrl(selectedImage) || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                    <span>Click to Expand</span>
                  </div>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg overflow-hidden border-2 ${selectedImage === img
                        ? 'border-blue-600'
                        : darkMode
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                        } transition-colors`}
                    >
                      <img
                        src={getImageUrl(img) || '/placeholder.svg'}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-20 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                {product.name}
              </h1>

              {/* Category & Subcategory */}
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                  {product.category}
                </span>
                {product.subcategory && (
                  <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                    {product.subcategory}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className={`text-4xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  ৳{Number(product.price).toFixed(2)}
                </span>
              </div>

              {/* Options Selection */}
              {product.options && product.options.map((option) => (
                <div key={option.id} className="mb-6">
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    {option.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) => (
                      <button
                        key={value.id}
                        onClick={() => handleOptionChange(option.name, value.name, value.image)}
                        className={`px-4 py-2 rounded-md border transition-all flex items-center gap-2 ${
                          selectedOptions[option.name] === value.name
                            ? 'border-blue-600 ring-2 ring-blue-600 ring-opacity-50'
                            : darkMode ? 'border-gray-700 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                        } ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                      >
                        {value.image && (
                          <img 
                            src={getImageUrl(value.image)} 
                            alt={value.name} 
                            className="w-6 h-6 rounded object-cover" 
                          />
                        )}
                        {value.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock > 0 ? (
                  <div className="flex items-center gap-2">
                    <Package className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {product.stock} in stock
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                    <span className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                      Out of stock
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className={`px-4 py-2 rounded-lg ${darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'
                      } transition-colors`}
                  >
                    -
                  </button>
                  <span className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} min-w-[3rem] text-center`}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className={`px-4 py-2 rounded-lg ${darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'
                      } transition-colors`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${product.stock <= 0
                    ? darkMode
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.stock <= 0 ? 'Out of Stock' : `Add ${quantity} to Cart`}
                </button>
                <WhatsAppButton product={product} darkMode={darkMode} />
              </div>
            </div>
          </div>

          {/* Description Section */}
          {product.description && (
            <>
              <br />
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  Description
                </h2>
                <div className={`prose ${darkMode ? 'prose-invert' : ''} max-w-none ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4">
                          <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => (
                        <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'} {...props} />
                      ),
                      th: ({ node, ...props }) => (
                        <th className={`px-4 py-2 text-left text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`} {...props} />
                      ),
                      td: ({ node, ...props }) => (
                        <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} {...props} />
                      ),
                      h1: ({ node, ...props }) => (
                        <h1 className={`text-2xl font-bold mt-6 mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`} {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className={`text-xl font-bold mt-5 mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`} {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className={`text-lg font-semibold mt-4 mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`} {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className={`list-disc list-inside mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className={`list-decimal list-inside mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="mb-1" {...props} />
                      ),
                      code: ({ node, inline, ...props }: any) => (
                        inline ?
                          <code className={`px-1.5 py-0.5 rounded text-sm font-mono ${darkMode ? 'bg-gray-800 text-blue-400' : 'bg-gray-100 text-blue-600'}`} {...props} /> :
                          <code className={`block p-3 rounded text-sm font-mono overflow-x-auto ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`} {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a className={`underline ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`} {...props} />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote className={`border-l-4 pl-4 italic my-3 ${darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'}`} {...props} />
                      ),
                    }}
                  >
                    {product.description}
                  </ReactMarkdown>
                </div>
              </div>
            </>
          )}

          {/* Reviews Section */}
          <div className="mt-12">
            <ReviewList productId={product.id} />
          </div>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                Similar Products in {product.category}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {similarProducts.map((similarProduct) => (
                  <Link
                    key={similarProduct.id}
                    href={`/product/${similarProduct.id}`}
                    className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow`}
                  >
                    <div className={`h-32 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center overflow-hidden`}>
                      <img
                        src={getImageUrl(similarProduct.image || similarProduct.options?.find(o => o.values.find(v => v.image))?.values.find(v => v.image)?.image || '') || '/placeholder.svg'}
                        alt={similarProduct.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1 truncate`}>
                        {similarProduct.name}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className={`text-lg font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          ৳{Number(similarProduct.price).toFixed(2)}
                        </span>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {similarProduct.stock > 0 ? `${similarProduct.stock} left` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Overlay */}
      {showLightbox && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" onClick={() => setShowLightbox(false)}>
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-50"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {allImages.length > 1 && (
              <button
                onClick={handlePrevImage}
                className="absolute left-2 md:-left-12 text-white hover:text-gray-300 p-2 bg-black bg-opacity-50 rounded-full md:bg-transparent"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            <img
              src={getImageUrl(selectedImage)}
              alt={product.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />

            {allImages.length > 1 && (
              <button
                onClick={handleNextImage}
                className="absolute right-2 md:-right-12 text-white hover:text-gray-300 p-2 bg-black bg-opacity-50 rounded-full md:bg-transparent"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Image Counter */}
            {allImages.length > 1 && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm">
                {allImages.indexOf(selectedImage) + 1} / {allImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  const productId = parseInt(id);

  if (isNaN(productId)) {
    return {
      notFound: true,
    };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        options: {
          include: {
            values: true
          }
        }
      }
    });

    if (!product || product.isArchived) {
      return {
        notFound: true,
      };
    }

    // Fetch similar products
    const similarProducts = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: productId },
      },
      take: 8,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        options: {
          include: {
            values: true
          }
        }
      }
    });

    // Serialize dates and decimals for JSON
    const serialize = (data: any): any => {
      return JSON.parse(JSON.stringify(data));
    };

    return {
      props: {
        initialData: {
          product: serialize(product),
          similarProducts: serialize(similarProducts),
        },
      },
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      props: {
        initialData: null,
        error: 'Failed to load product',
      },
    };
  }
};
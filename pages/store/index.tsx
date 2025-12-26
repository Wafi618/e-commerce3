import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { Search, Package, Heart, Filter, X } from 'lucide-react';
import { DualRangeSlider } from '@/components/ui/DualRangeSlider';
import { Layout } from '@/components/Layout';
import { getImageUrl } from '@/utils/imageUtils';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { ProductImage } from '@/components/ui/ProductImage';
import { useCart, useProduct, useTheme, useWishlist } from '@/contexts';
import { prisma } from '@/lib/prisma';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../api/auth/[...nextauth]';

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
                { sortOrder: 'asc' },
                { createdAt: 'desc' }
            ] as any : [
                { sortOrder: 'asc' },
                { createdAt: 'desc' }
            ] as any,
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

export default function StorePage({ products: initialProducts }: any) {
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
        error,
        searchQuery
    } = useProduct();
    const { darkMode } = useTheme();
    const [animatingProductId, setAnimatingProductId] = useState<string | null>(null);
    const [currentImages, setCurrentImages] = useState<Record<string, string>>({});
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const { priceRange, setPriceRange, loading: productsLoading } = useProduct(); // Destructure loading as productsLoading

    const [showFilters, setShowFilters] = useState(false);
    const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(priceRange);

    useEffect(() => {
        setLocalPriceRange(priceRange);
    }, [priceRange]);

    const handleApplyFilters = () => {
        setPriceRange(localPriceRange);
    };

    const handleClearFilters = () => {
        setPriceRange([0, 100000]);
        setLocalPriceRange([0, 100000]);
    };

    // Check if price filter is active (not at default values)
    const isFilterActive = priceRange[0] > 0 || priceRange[1] < 100000;

    const handleImageChange = (productId: string, imageUrl: string) => {
        setCurrentImages(prev => ({
            ...prev,
            [productId]: imageUrl
        }));
    };

    const handleAddToCart = (product: any) => {
        setAnimatingProductId(product.id);

        // Find if the currently displayed image corresponds to a specific option
        const currentImage = currentImages[product.id] || product.image;
        let selectedOptions: Record<string, string> = {};

        // Normalize ID to integer (search split products have "id-variantId" format)
        const originalId = typeof product.id === 'string' && product.id.includes('-')
            ? parseInt(product.id.split('-')[0])
            : typeof product.id === 'string' ? parseInt(product.id) : product.id;

        // 1. Handle split products from search (which have variantName)
        if (product.variantName && product.options) {
            // Find which option this variant belongs to (usually 'Color' or 'Colour')
            const colorOption = product.options.find(
                (opt: any) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
            );
            if (colorOption) {
                selectedOptions[colorOption.name] = product.variantName;
            }
        }

        // 2. If no variantName or no match yet, try matching by image (slideshow)
        if (Object.keys(selectedOptions).length === 0 && product.options) {
            // Try to find which option value has this image
            for (const option of product.options) {
                const matchingValue = option.values.find((val: any) => val.image === currentImage);
                if (matchingValue) {
                    selectedOptions[option.name] = matchingValue.name;
                    // We only support one option selection per image for now (first match wins)
                    break;
                }
            }
        }

        addToCart({ ...product, id: originalId, selectedOptions });

        setTimeout(() => {
            setAnimatingProductId(null);
        }, 600); // Animation duration
    };

    return (
        <Layout>
            <Head>
                <title>Shop | Star Accessories</title>
                <meta name="description" content="Browse our collection of premium fashion accessories." />
            </Head>
            <div className="relative pt-8">

                {/* Shop Section */}
                <div id="shop-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 tron-grid-bg">

                    <div className="mb-8 relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-black dark:text-white">All Products</h2>

                            {/* Search Button */}
                            <button
                                onClick={() => setShowSearchModal(true)}
                                className="tron-btn flex items-center gap-2"
                                title="Search Products"
                            >
                                <Search className="w-5 h-5" />
                                <span className="hidden sm:inline">Search</span>
                            </button>

                            {/* Filter Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`tron-btn flex items-center gap-2 ml-2 ${showFilters ? 'bg-blue-600 text-white border-blue-500' : ''}`}
                                title="Filter Products"
                            >
                                <Filter className="w-5 h-5" />
                                <span className="hidden sm:inline">Filters</span>
                            </button>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <div className={`mb-6 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Price Range</h3>
                                    <button onClick={() => setShowFilters(false)} className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}>
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="px-2 mb-6">
                                    <DualRangeSlider
                                        min={0}
                                        max={100000}
                                        values={localPriceRange}
                                        onChange={setLocalPriceRange}
                                        darkMode={darkMode}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Min Price</label>
                                        <input
                                            type="number"
                                            value={localPriceRange[0]}
                                            onChange={(e) => setLocalPriceRange([Number(e.target.value), localPriceRange[1]])}
                                            className={`w-full px-3 py-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Max Price</label>
                                        <input
                                            type="number"
                                            value={localPriceRange[1]}
                                            onChange={(e) => setLocalPriceRange([localPriceRange[0], Number(e.target.value)])}
                                            className={`w-full px-3 py-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <button
                                            onClick={handleApplyFilters}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                                        >
                                            Apply
                                        </button>
                                        {isFilterActive && (
                                            <button
                                                onClick={handleClearFilters}
                                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                                            >
                                                Clear Filters
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 overflow-x-auto pb-3">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${selectedCategory === cat
                                        ? 'tron-pill-active'
                                        : 'tron-pill'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Subcategories */}
                        {selectedCategory !== 'All' && subcategories.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 mt-3">
                                {subcategories.map(sub => (
                                    <button
                                        key={sub}
                                        onClick={() => setSelectedSubcategory(sub)}
                                        className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-all ${selectedSubcategory === sub
                                            ? 'tron-pill-active'
                                            : 'tron-pill'
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
                            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Try adjusting your search or filters.</p>
                            {isFilterActive && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && products.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {products.map(product => (
                                <div key={product.id} className={`tron-card relative ${animatingProductId === product.id ? 'product-added' : ''}`}>
                                    {/* Wishlist Button */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const pid = typeof product.id === 'string' && product.id.includes('-')
                                                ? parseInt(product.id.split('-')[0])
                                                : Number(product.id);

                                            if (isInWishlist(pid)) {
                                                removeFromWishlist(pid);
                                            } else {
                                                addToWishlist(pid);
                                            }
                                        }}
                                        className={`absolute top-4 left-4 p-2 rounded-full z-20 transition-all ${isInWishlist(typeof product.id === 'string' && product.id.includes('-') ? parseInt(product.id.split('-')[0]) : Number(product.id))
                                            ? 'bg-red-500 text-white shadow-red-500/50 shadow-lg'
                                            : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white shadow-sm'
                                            }`}
                                    >
                                        <Heart className={`w-5 h-5 ${isInWishlist(typeof product.id === 'string' && product.id.includes('-') ? parseInt(product.id.split('-')[0]) : Number(product.id)) ? 'fill-current' : ''}`} />
                                    </button>

                                    {/* Clickable product image - taller for full visibility */}
                                    <Link href={`/product/${product.id}`}>
                                        <div className="tron-image-container h-[500px] flex items-center justify-center cursor-pointer p-4">
                                            <ProductImage
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-contain"
                                                options={(product as any).options}
                                                onImageChange={(img) => handleImageChange(product.id, img)}
                                                disableSlideshow={!!searchQuery}
                                                imageRotation={(product as any).imageRotation || 0}
                                            />
                                        </div>
                                    </Link>
                                    <div className="tron-content">
                                        <Link href={`/product/${product.id}`}>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 mb-1 cursor-pointer transition-colors">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{product.category}</p>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-2xl tron-price">৳{Number(product.price).toFixed(2)}</span>
                                            <span className={`text-sm ${product.stock > 0 ? 'text-green-600 dark:text-cyan-400/70' : 'text-red-500 dark:text-red-400'}`}>
                                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                                            </span>
                                        </div>
                                        <div className="flex gap-3">
                                            <Link href={`/product/${product.id}`} className="flex-1">
                                                <button className="w-full tron-btn">
                                                    View Details
                                                </button>
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddToCart(product);
                                                }}
                                                disabled={product.stock <= 0}
                                                className="flex-1 tron-btn tron-btn-primary"
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

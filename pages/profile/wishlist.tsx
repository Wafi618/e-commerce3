import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { useAuth, useTheme, useWishlist } from '@/contexts';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';
import { useCart } from '@/contexts';

export default function WishlistPage() {
    const { user, loading: authLoading } = useAuth();
    const { darkMode } = useTheme();
    const { addToCart } = useCart();
    const { removeFromWishlist, wishlist: wishlistIds } = useWishlist();

    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            window.location.href = '/auth/signin?redirect=/profile/wishlist';
        }
    }, [authLoading, user]);

    useEffect(() => {
        if (user) {
            fetchWishlistItems();
        }
    }, [user, wishlistIds]); // Refresh if IDs change (e.g. removed from header)

    const fetchWishlistItems = async () => {
        try {
            const res = await fetch('/api/wishlist');
            const data = await res.json();
            if (data.success) {
                setWishlistItems(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch wishlist', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (productId: number) => {
        await removeFromWishlist(productId);
        // Local state update is handled by useEffect dependency on wishlistIds?
        // Actually wishlistIds change will trigger refetch which is fine.
        // Or we can optimistically update local state.
        setWishlistItems(prev => prev.filter(item => item.productId !== productId));
    };

    if (authLoading || loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Head>
                <title>My Wishlist | Star Accessories</title>
            </Head>
            <div className="relative min-h-screen">
                <ParticlesBackground darkMode={darkMode} />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/profile" className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Wishlist</h1>
                        <Heart className="w-8 h-8 text-red-500 fill-current" />
                    </div>

                    {wishlistItems.length === 0 ? (
                        <div className={`text-center py-16 rounded-lg ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
                            <Heart className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                            <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Your wishlist is empty</h2>
                            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start saving your favorite items!</p>
                            <Link href="/store">
                                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    Browse Store
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {wishlistItems.map((item) => {
                                const product = item.product;
                                return (
                                    <div key={item.id} className={`rounded-lg overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm hover:shadow-md transition-all`}>
                                        <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                                            <img
                                                src={getImageUrl(product.image)}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => handleRemove(product.id)}
                                                className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 hover:bg-white hover:text-red-600 transition-colors shadow-sm"
                                                title="Remove from wishlist"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            <Link href={`/product/${product.id}`}>
                                                <h3 className={`text-lg font-semibold mb-1 truncate ${darkMode ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'}`}>
                                                    {product.name}
                                                </h3>
                                            </Link>
                                            <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.category}</p>
                                            <div className="flex justify-between items-center mt-4">
                                                <span className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                    ৳{Number(product.price).toFixed(2)}
                                                </span>
                                                <button
                                                    onClick={() => addToCart(product)}
                                                    disabled={product.stock <= 0}
                                                    className={`p-2 rounded-lg ${product.stock > 0
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                                    title={product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                                >
                                                    <ShoppingCart className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface WishlistContextType {
    wishlist: number[]; // Array of Product IDs
    addToWishlist: (productId: number) => Promise<void>;
    removeFromWishlist: (productId: number) => Promise<void>;
    isInWishlist: (productId: number) => boolean;
    loading: boolean;
    wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const [wishlist, setWishlist] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            setWishlist([]);
        }
    }, [user]);

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/wishlist');
            const data = await res.json();
            if (data.success) {
                // storage format: array of productIds
                setWishlist(data.data.map((item: any) => item.productId));
            }
        } catch (error) {
            console.error('Failed to fetch wishlist');
        } finally {
            setLoading(false);
        }
    };

    const addToWishlist = async (productId: number) => {
        if (!user) {
            addNotification('Please login to add to wishlist', 'info');
            return;
        }

        // Optimistic Update
        setWishlist(prev => [...prev, productId]);

        try {
            const res = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message);
            }
            addNotification('Added to wishlist', 'success');
        } catch (error: any) {
            // Revert
            setWishlist(prev => prev.filter(id => id !== productId));
            addNotification(error.message || 'Failed to update wishlist', 'error');
        }
    };

    const removeFromWishlist = async (productId: number) => {
        if (!user) return;

        // Optimistic Update
        setWishlist(prev => prev.filter(id => id !== productId));

        try {
            const res = await fetch(`/api/wishlist/${productId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message);
            }
            addNotification('Removed from wishlist', 'info');
        } catch (error: any) {
            // Revert
            setWishlist(prev => [...prev, productId]);
            addNotification('Failed to update wishlist', 'error');
        }
    };

    const isInWishlist = (productId: number) => {
        return wishlist.includes(productId);
    };

    return (
        <WishlistContext.Provider value={{
            wishlist,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            loading,
            wishlistCount: wishlist.length
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

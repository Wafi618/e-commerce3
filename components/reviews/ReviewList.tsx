import React, { useEffect, useState } from 'react';
import { StarRating } from '../ui/StarRating';
import { ReviewForm } from './ReviewForm';
import { useAuth } from '@/contexts';
import { UserCircle, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Review {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
        name: string | null;
        city: string | null;
        country: string | null;
        image: string | null;
    };
}

interface ReviewListProps {
    productId: number;
}

export const ReviewList: React.FC<ReviewListProps> = ({ productId }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [average, setAverage] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/products/${productId}/reviews`);
            const data = await res.json();
            setReviews(data.reviews);
            setAverage(data.average);
            setTotal(data.total);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    return (
        <div className="space-y-8">
            {/* Summary Section */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Customer Reviews</h2>
                    <div className="flex items-center space-x-2">
                        <StarRating rating={Math.round(average)} size={24} />
                        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                            {average.toFixed(1)} out of 5
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">({total} reviews)</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Reviews List */}
                <div className="lg:col-span-2 space-y-6">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading reviews...</div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                            <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review!</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        {review.user.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={review.user.image} alt={review.user.name || 'User'} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <UserCircle className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{review.user.name || 'Anonymous'}</h4>
                                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                                {(review.user.city || review.user.country) && (
                                                    <span className="flex items-center">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {[review.user.city, review.user.country].filter(Boolean).join(', ')}
                                                    </span>
                                                )}
                                                <span>•</span>
                                                <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <StarRating rating={review.rating} size={16} />
                                </div>
                                {review.comment && (
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Review Form (Sticky on Desktop) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        {user ? (
                            <ReviewForm productId={productId} onReviewSubmitted={fetchReviews} />
                        ) : (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl text-center">
                                <p className="text-blue-800 dark:text-blue-200 mb-2">Please login to write a review</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

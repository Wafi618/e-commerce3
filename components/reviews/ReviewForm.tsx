import React, { useState } from 'react';
import { StarRating } from '../ui/StarRating';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
    productId: number;
    onReviewSubmitted: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const res = await fetch(`/api/products/${productId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, comment }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit review');
            }

            toast.success('Review submitted successfully!');
            setRating(0);
            setComment('');
            onReviewSubmitted();
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Write a Review</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                <StarRating rating={rating} interactive onRatingChange={setRating} size={28} />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comment (Optional)</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    rows={4}
                    placeholder="Share your thoughts about the product..."
                />
            </div>

            {error && (
                <div className="mb-4 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    'Submit Review'
                )}
            </button>
        </form>
    );
};

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: number;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
    rating,
    maxRating = 5,
    size = 20,
    interactive = false,
    onRatingChange,
}) => {
    const [hoverRating, setHoverRating] = React.useState(0);

    const handleMouseEnter = (index: number) => {
        if (interactive) {
            setHoverRating(index);
        }
    };

    const handleMouseLeave = () => {
        if (interactive) {
            setHoverRating(0);
        }
    };

    const handleClick = (index: number) => {
        if (interactive && onRatingChange) {
            onRatingChange(index);
        }
    };

    return (
        <div className="flex items-center space-x-1">
            {[...Array(maxRating)].map((_, i) => {
                const index = i + 1;
                const isFilled = interactive ? index <= (hoverRating || rating) : index <= rating;

                return (
                    <Star
                        key={i}
                        size={size}
                        className={`transition-colors duration-200 ${interactive ? 'cursor-pointer' : ''
                            } ${isFilled
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                            }`}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleClick(index)}
                    />
                );
            })}
        </div>
    );
};

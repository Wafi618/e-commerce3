import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/utils/imageUtils';

interface ProductImageProps {
    src: string;
    alt: string;
    className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({ src, alt, className }) => {
    const [transform, setTransform] = useState('scale(1) translate(0, 0)');
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;

        // Calculate percentage position (0 to 1)
        const xPercent = x / width;
        const yPercent = y / height;

        // Calculate translate values (move image opposite to cursor to pan)
        // Range: -50% to 50% of image size (assuming scale 2)
        const xTranslate = (0.5 - xPercent) * 100;
        const yTranslate = (0.5 - yPercent) * 100;

        setTransform(`scale(2) translate(${xTranslate}px, ${yTranslate}px)`);
    };

    const handleMouseLeave = () => {
        setTransform('scale(1) translate(0, 0)');
    };

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden cursor-crosshair ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="w-full h-full transition-transform duration-200 ease-out"
                style={{ transform }}
            >
                <Image
                    src={getImageUrl(src) || 'https://via.placeholder.com/300x200?text=No+Image'}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                />
            </div>
        </div>
    );
};

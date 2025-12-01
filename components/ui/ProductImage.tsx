import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/utils/imageUtils';

interface ProductImageProps {
    src?: string;
    alt: string;
    className?: string;
    options?: any[];
}

export const ProductImage: React.FC<ProductImageProps> = ({ src, alt, className, options }) => {
    const [transform, setTransform] = useState('scale(1) translate(0, 0)');
    const [currentImage, setCurrentImage] = useState(src);
    const [slideshowImages, setSlideshowImages] = useState<string[]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const slideshowIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize slideshow images if main image is missing/empty
    useEffect(() => {
        if (!src || src.trim() === '') {
            const images: string[] = [];
            options?.forEach(opt => {
                opt.values?.forEach((val: any) => {
                    if (val.image && val.image.trim() !== '') {
                        images.push(val.image);
                    }
                });
            });
            if (images.length > 0) {
                setSlideshowImages(images);
                setCurrentImage(images[0]);
            } else {
                 // Fallback if absolutely no images found
                 setCurrentImage('/placeholder.svg');
            }
        } else {
            setCurrentImage(src);
        }
    }, [src, options]);

    // Handle slideshow
    useEffect(() => {
        if (slideshowImages.length > 1) {
            slideshowIntervalRef.current = setInterval(() => {
                setCurrentSlideIndex(prev => {
                    const nextIndex = (prev + 1) % slideshowImages.length;
                    setCurrentImage(slideshowImages[nextIndex]);
                    return nextIndex;
                });
            }, 2000); // Change slide every 2 seconds
        }

        return () => {
            if (slideshowIntervalRef.current) {
                clearInterval(slideshowIntervalRef.current);
            }
        };
    }, [slideshowImages]);

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
                className="w-full h-full transition-transform duration-200 ease-out relative"
                style={{ transform }}
            >
                <Image
                    src={getImageUrl(currentImage || '') || '/placeholder.svg'}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-opacity duration-500"
                />
            </div>
            {/* Optional: Dots for slideshow */}
            {slideshowImages.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
                    {slideshowImages.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`w-1.5 h-1.5 rounded-full ${idx === currentSlideIndex ? 'bg-white' : 'bg-white/50'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
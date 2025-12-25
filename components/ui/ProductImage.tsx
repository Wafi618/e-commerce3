import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/utils/imageUtils';

interface ProductImageProps {
    src?: string;
    alt: string;
    className?: string;
    options?: any[];
    onImageChange?: (imageUrl: string) => void;
    disableSlideshow?: boolean;
    imageRotation?: number;
}


export const ProductImage: React.FC<ProductImageProps> = ({ src, alt, className, options, onImageChange, disableSlideshow, imageRotation = 0 }) => {
    const [transform, setTransform] = useState('scale(1) translate(0, 0)');
    const [currentImage, setCurrentImage] = useState(src);
    const [slideshowImages, setSlideshowImages] = useState<{ src: string, rotation: number }[]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const slideshowIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastReportedImageRef = useRef<string | null>(null);

    // Initialize slideshow images
    useEffect(() => {
        const images: { src: string, rotation: number }[] = [];

        // Always include the main image first if it exists
        if (src && src.trim() !== '') {
            images.push({ src, rotation: imageRotation });
        }

        // Add option images
        options?.forEach(opt => {
            opt.values?.forEach((val: any) => {
                if (val.image && val.image.trim() !== '' && !images.some(img => img.src === val.image)) {
                    images.push({ src: val.image, rotation: val.rotation || 0 });
                }
            });
        });

        if (images.length === 0) {
            images.push({ src: '/placeholder.svg', rotation: 0 });
        }

        setSlideshowImages(images);
    }, [src, options, imageRotation]);

    // Handle slideshow auto-play
    useEffect(() => {
        if (!disableSlideshow && slideshowImages.length > 1) {
            slideshowIntervalRef.current = setInterval(() => {
                setCurrentSlideIndex(prev => (prev + 1) % slideshowImages.length);
            }, 3000); // Slower, 3s interval for better viewing
        }

        return () => {
            if (slideshowIntervalRef.current) {
                clearInterval(slideshowIntervalRef.current as any);
            }
        };
    }, [slideshowImages, disableSlideshow]);

    // Notify parent of image change - Fix for infinite loop
    useEffect(() => {
        const currentImgObj = slideshowImages[currentSlideIndex];
        if (onImageChange && slideshowImages.length > 0 && currentImgObj) {
            // Only report if the image has actually changed from what we last reported
            if (lastReportedImageRef.current !== currentImgObj.src) {
                lastReportedImageRef.current = currentImgObj.src;
                onImageChange(currentImgObj.src);
            }
        }
    }, [currentSlideIndex, slideshowImages, onImageChange]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        const xPercent = x / width;
        const yPercent = y / height;
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
                className="w-full h-full relative"
                style={{ transform, transition: 'transform 0.2s ease-out' }}
            >
                {slideshowImages.map((imgObj, idx) => (
                    <div
                        key={`${imgObj.src}-${idx}`}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${idx === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        <Image
                            src={getImageUrl(imgObj.src) || '/placeholder.svg'}
                            alt={`${alt} - view ${idx + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-contain transition-transform duration-300"
                            style={{ transform: `rotate(${imgObj.rotation}deg)` }}
                            priority={idx === 0}
                        />
                    </div>
                ))}
            </div>

            {/* Slideshow Indicators - Enhanced visibility */}
            {
                !disableSlideshow && slideshowImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-20 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                        {slideshowImages.map((_, idx) => (
                            <div
                                key={idx}
                                className={`transition-all duration-300 rounded-full ${idx === currentSlideIndex
                                    ? 'w-2.5 h-2.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                                    }`}
                            />
                        ))}
                    </div>
                )
            }

            {/* Options Badge */}
            {!disableSlideshow && slideshowImages.length > 1 && (
                <div className="absolute top-3 right-3 z-20 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 text-[10px] text-white/90 font-medium tracking-wider uppercase shadow-sm">
                    {slideshowImages.length} Styles
                </div>
            )}
        </div>
    );
};
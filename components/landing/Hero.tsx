import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ParticlesBackground } from '../ParticlesBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { YouTubeEmbed } from './YouTubeEmbed';

interface HeroProps {
    config: {
        heroTitle: string;
        heroSubtitle: string;
        heroImage: string | null;
        heroVideo: string | null;
        showVideo: boolean;
        buttonText: string;
        videoOrientation?: string;
        media?: any[];
    };
}

export const Hero: React.FC<HeroProps> = ({ config }) => {
    const { darkMode } = useTheme();

    const scrollToShop = () => {
        const shopSection = document.getElementById('shop-section');
        if (shopSection) {
            shopSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getAspectRatioClass = () => {
        switch (config.videoOrientation) {
            case 'portrait': return 'aspect-[9/16] max-w-sm mx-auto';
            case 'square': return 'aspect-square max-w-md mx-auto';
            default: return 'aspect-video w-full max-w-4xl mx-auto';
        }
    };

    return (
        <div className={`relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Background Particles */}
            <div className="absolute inset-0 z-0">
                <ParticlesBackground darkMode={darkMode} />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="flex flex-col items-center gap-12 text-center">

                    {/* 1. Header Text (Top) */}
                    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in-up">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
                            <span className={`block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {config.heroTitle || "Discover Amazing Products"}
                            </span>
                        </h1>

                        <p className={`text-lg md:text-2xl max-w-2xl mx-auto font-light ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {config.heroSubtitle || "Premium Fashion & Accessories"}
                        </p>
                    </div>

                    {/* 2. Media Placeholder (Middle) */}
                    <div className="w-full relative animate-fade-in-up delay-200">
                        <div className="flex flex-wrap justify-center gap-8 md:gap-12 items-end">
                            {/* Support for multiple media items */}
                            {(config.media && config.media.length > 0 ? config.media : (
                                // Fallback for old single media config if no new media array exists
                                (config.showVideo && config.heroVideo) ? [{ type: 'video', url: config.heroVideo, orientation: config.videoOrientation || 'landscape' }] :
                                    config.heroImage ? [{ type: 'image', url: config.heroImage, orientation: 'landscape' }] : []
                            )).map((item: any, index: number) => (
                                <React.Fragment key={index}>
                                    <div className={`relative shrink-0 ${item.orientation === 'portrait' ? 'aspect-[9/16] w-[280px] md:w-[320px]' :
                                        item.orientation === 'square' ? 'aspect-square w-[300px] md:w-[400px]' :
                                            'aspect-video w-[320px] md:w-[500px]'
                                        } rounded-3xl overflow-hidden shadow-2xl border-4 ${darkMode ? 'border-gray-800' : 'border-white'} group hover:scale-[1.02] transition-transform duration-500`}>

                                        {item.type === 'video' ? (
                                            (() => {
                                                const getYouTubeId = (url: string) => {
                                                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                                    const match = url.match(regExp);
                                                    return (match && match[2].length === 11) ? match[2] : null;
                                                };
                                                const youtubeId = getYouTubeId(item.url || '');

                                                if (youtubeId) {
                                                    return (
                                                        <div className="relative w-full h-full group">
                                                            <YouTubeEmbed videoId={youtubeId} className="w-full h-full object-cover pointer-events-none transform scale-[1.00]" />
                                                            {/* Top Blur Overlay - thicker to cover title */}
                                                            <div className="absolute top-0 left-0 right-0 h-[10%] bg-black/40 backdrop-blur-md z-10 pointer-events-none transition-opacity duration-300"></div>
                                                            {/* Bottom Blur Overlay - thick enough for controls */}
                                                            <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black/40 backdrop-blur-md z-10 pointer-events-none transition-opacity duration-300"></div>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <video
                                                            autoPlay
                                                            loop
                                                            muted
                                                            playsInline
                                                            className="w-full h-full object-cover"
                                                            src={item.url || ''}
                                                        />
                                                    );
                                                }
                                            })()
                                        ) : (
                                            <img
                                                src={item.url}
                                                alt={`Hero ${index}`}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        {/* Gloss effect */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                                    </div>

                                    {/* Mobile Button: After every item */}
                                    <div className="w-full flex justify-center py-6 md:hidden">
                                        <button
                                            onClick={scrollToShop}
                                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-full text-lg font-bold transition-all hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                                        >
                                            <span className="relative z-10">{config.buttonText || "Shop Now"}</span>
                                            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        </button>
                                    </div>

                                    {/* Desktop Button: After every 3rd item (end of a row) OR at the very end of list */}
                                    {((index + 1) % 3 === 0 || index === (config.media || []).length - 1) && (
                                        <div className="w-full hidden md:flex justify-center py-10 basis-full">
                                            <button
                                                onClick={scrollToShop}
                                                className="group relative inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-full text-xl font-bold transition-all hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 overflow-hidden"
                                            >
                                                <span className="relative z-10">{config.buttonText || "Shop Now"}</span>
                                                <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                            </button>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Decorative blobs behind media */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 opacity-30 pointer-events-none">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
                        </div>
                    </div>

                    {/* Default Button if no media exists or for edge cases */}
                    {/* Removed static button as per request to have it interlaced */}

                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { Save, Layout, Video, Image as ImageIcon, Type, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ImageUpload } from './ImageUpload';

interface HeroMedia {
    id?: number;
    type: 'image' | 'video';
    url: string;
    videoUrl?: string; // Local state for persistence
    imageUrl?: string; // Local state for persistence
    orientation: 'landscape' | 'portrait' | 'square';
    loop?: boolean;
    blurTop?: number;
    blurBottom?: number;
}

interface LandingPageConfig {
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string | null;
    heroVideo: string | null;
    showVideo: boolean;
    buttonText: string;
    videoOrientation: string;
    media: HeroMedia[];
}

export const LandingTab = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<LandingPageConfig>({
        heroTitle: '',
        heroSubtitle: '',
        heroImage: null,
        heroVideo: '',
        showVideo: false,
        buttonText: 'Shop Now',
        videoOrientation: 'landscape',
        media: []
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/landing');
            if (!res.ok) throw new Error('Failed to fetch config');
            const data = await res.json();

            // Backwards compatibility & Initialize local state
            let media = (data.media || []).map((m: any) => ({
                ...m,
                videoUrl: m.type === 'video' ? m.url : '',
                imageUrl: m.type === 'image' ? m.url : '',
                loop: m.loop ?? false,
                blurTop: m.blurTop ?? 10,
                blurBottom: m.blurBottom ?? 10
            }));

            if (media.length === 0 && (data.heroImage || (data.showVideo && data.heroVideo))) {
                if (data.showVideo && data.heroVideo) {
                    media.push({
                        type: 'video',
                        url: data.heroVideo,
                        videoUrl: data.heroVideo,
                        imageUrl: '',
                        orientation: data.videoOrientation || 'landscape',
                        loop: false,
                        blurTop: 10,
                        blurBottom: 10
                    });
                } else if (data.heroImage) {
                    media.push({
                        type: 'image',
                        url: data.heroImage,
                        videoUrl: '',
                        imageUrl: data.heroImage,
                        orientation: 'landscape',
                        loop: false,
                        blurTop: 10,
                        blurBottom: 10
                    });
                }
            }

            setConfig({ ...data, media });
        } catch (error) {
            console.error(error);
            toast.error('Failed to load landing page settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Prepare payload: Ensure 'url' matches current 'type'
            const payload = {
                ...config,
                media: config.media.map(m => ({
                    ...m,
                    url: m.type === 'video' ? (m.videoUrl || '') : (m.imageUrl || '')
                }))
            };

            const res = await fetch('/api/admin/landing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success('Landing page updated successfully');
            fetchConfig(); // Refresh to ensure sync
        } catch (error) {
            console.error(error);
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const addMedia = () => {
        setConfig(prev => ({
            ...prev,
            media: [...prev.media, {
                type: 'video',
                url: '',
                videoUrl: '',
                imageUrl: '',
                orientation: 'landscape',
                loop: false,
                blurTop: 10,
                blurBottom: 10
            }]
        }));
    };

    const removeMedia = (index: number) => {
        setConfig(prev => ({
            ...prev,
            media: prev.media.filter((_, i) => i !== index)
        }));
    };

    const updateMedia = (index: number, updates: Partial<HeroMedia>) => {
        setConfig(prev => ({
            ...prev,
            media: prev.media.map((item, i) => i === index ? { ...item, ...updates } : item)
        }));
    };


    if (loading) {
        return <div className="flex justify-center p-12 text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layout className="w-6 h-6 text-blue-500" />
                    Landing Page Configuration
                </h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                    <Save size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Text Config */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 sticky top-6">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                            <Type className="w-5 h-5 text-purple-400" />
                            Text Content
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Hero Title
                                </label>
                                <input
                                    type="text"
                                    value={config.heroTitle}
                                    onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Discover Amazing Products"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Hero Subtitle
                                </label>
                                <input
                                    type="text"
                                    value={config.heroSubtitle}
                                    onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Premium Fashion & Accessories"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    CTA Button Text
                                </label>
                                <input
                                    type="text"
                                    value={config.buttonText}
                                    onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Shop Now"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Media List */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-pink-400" />
                                Hero Media Gallery
                            </h3>
                            <button
                                onClick={addMedia}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                            >
                                <Plus size={16} />
                                Add Media
                            </button>
                        </div>

                        <div className="space-y-4">
                            {config.media.length === 0 ? (
                                <p className="text-gray-500 text-center py-8 bg-gray-900/50 rounded-lg border border-dashed border-gray-700">
                                    No media added. Click "Add Media" to start.
                                </p>
                            ) : (
                                config.media.map((item, index) => (
                                    <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-700 relative animate-fadeIn group">
                                        <button
                                            onClick={() => removeMedia(index)}
                                            className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover:opacity-100 z-10"
                                            title="Remove"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Config Column */}
                                            <div className="space-y-4">
                                                <div className="flex bg-gray-800 p-1 rounded-lg w-max border border-gray-700">
                                                    <button
                                                        onClick={() => updateMedia(index, { type: 'image' })}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${item.type === 'image' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                                    >
                                                        Image
                                                    </button>
                                                    <button
                                                        onClick={() => updateMedia(index, { type: 'video' })}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${item.type === 'video' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                                    >
                                                        Video
                                                    </button>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">Orientation</label>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {['landscape', 'portrait', 'square'].map(opt => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => updateMedia(index, { orientation: opt as any })}
                                                                className={`px-2 py-1 rounded text-[10px] uppercase font-bold border transition-colors ${item.orientation === opt ? 'bg-blue-900/30 text-blue-400 border-blue-500/50' : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-500'}`}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Advanced Config */}
                                                <div className="pt-2 border-t border-gray-800 space-y-3">
                                                    {item.type === 'video' && (
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.loop ?? false}
                                                                onChange={(e) => updateMedia(index, { loop: e.target.checked })}
                                                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                                                            />
                                                            <span className="text-xs text-gray-400">Loop Video</span>
                                                        </label>
                                                    )}

                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs text-gray-400">
                                                            <span>Top Blur</span>
                                                            <span className="text-gray-500">{item.blurTop ?? 10}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="50"
                                                            value={item.blurTop ?? 10}
                                                            onChange={(e) => updateMedia(index, { blurTop: parseInt(e.target.value) })}
                                                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs text-gray-400">
                                                            <span>Bottom Blur</span>
                                                            <span className="text-gray-500">{item.blurBottom ?? 10}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="50"
                                                            value={item.blurBottom ?? 10}
                                                            onChange={(e) => updateMedia(index, { blurBottom: parseInt(e.target.value) })}
                                                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Input Column */}
                                            <div>
                                                {item.type === 'video' ? (
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-medium text-gray-400">Video Link (YouTube/MP4)</label>
                                                        <input
                                                            type="text"
                                                            value={item.videoUrl || ''}
                                                            onChange={(e) => updateMedia(index, { videoUrl: e.target.value })}
                                                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-medium text-gray-400">Image Upload</label>
                                                        <ImageUpload
                                                            label=""
                                                            currentImage={item.imageUrl || null}
                                                            onImageUpload={(url) => updateMedia(index, { imageUrl: url })}
                                                            onImageRemove={() => updateMedia(index, { imageUrl: '' })}
                                                            className="h-24"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

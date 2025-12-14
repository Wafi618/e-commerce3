import React, { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
    currentImage?: string | null;
    onImageUpload: (imageUrl: string) => void;
    onImageRemove: () => void;
    label?: string;
    className?: string; // Add className prop
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    currentImage,
    onImageUpload,
    onImageRemove,
    label = "Upload Image",
    className = "" // Default to empty string
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        try {
            setIsUploading(true);

            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64String = reader.result as string;

                    const response = await fetch('/api/admin/upload-image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ imageBase64: base64String }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Upload failed');
                    }

                    onImageUpload(data.url);
                    toast.success('Image uploaded successfully');
                } catch (error) {
                    console.error('Upload error:', error);
                    toast.error('Failed to upload image');
                } finally {
                    setIsUploading(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error reading file:', error);
            toast.error('Error reading file');
            setIsUploading(false);
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-gray-400">
                {label}
            </label>

            <div className="flex items-center space-x-4">
                {currentImage ? (
                    <div className="relative w-40 h-24 rounded-lg overflow-hidden group border border-gray-700">
                        <Image
                            src={currentImage}
                            alt="Uploaded"
                            fill
                            className="object-cover"
                        />
                        <button
                            onClick={onImageRemove}
                            className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-40 h-24 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-800/50 transition-colors group"
                    >
                        {isUploading ? (
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        ) : (
                            <>
                                <Upload className="w-6 h-6 text-gray-500 group-hover:text-blue-500 mb-1" />
                                <span className="text-xs text-gray-500 group-hover:text-gray-400">Click to upload</span>
                            </>
                        )}
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>
        </div>
    );
};

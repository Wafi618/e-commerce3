import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';

export class ImageService {
    /**
     * Uploads a base64 image to Freeimage.host
     */
    static async uploadImage(base64Data: string): Promise<string> {
        try {
            if (!process.env.FREEIMAGE_API_KEY) {
                throw new Error('FREEIMAGE_API_KEY is not configured');
            }

            // Remove header if present
            const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");

            const formData = new FormData();
            formData.append('key', process.env.FREEIMAGE_API_KEY);
            formData.append('source', base64Image);
            formData.append('format', 'json');

            const response = await axios.post('https://freeimage.host/api/1/upload', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });

            if (response.data.status_code !== 200) {
                throw new Error(`Upload failed: ${response.data.error.message}`);
            }

            return response.data.image.url;
        } catch (error: any) {
            console.error('Image upload error:', error.message);
            throw new Error('Failed to upload image provider');
        }
    }

    /**
     * Rotates a base64 image by the specified degrees using Sharp.
     * Returns the new base64 string.
     */
    static async rotateImage(base64Data: string, degrees: number): Promise<string> {
        try {
            // Clean base64 string
            const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Image, 'base64');

            // Process with Sharp
            const rotatedBuffer = await sharp(buffer)
                .rotate(degrees)
                .toBuffer();

            // Convert back to base64
            const mimeType = base64Data.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
            return `data:${mimeType};base64,${rotatedBuffer.toString('base64')}`;
        } catch (error: any) {
            console.error('Image rotation error:', error);
            throw new Error(`Failed to rotate image: ${error.message}`);
        }
    }
}

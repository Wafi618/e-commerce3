import { NextApiRequest, NextApiResponse } from 'next';

// Increase the body size limit to allow larger image uploads
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Increased to 10mb just to be safe
        },
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { imageBase64 } = req.body;
    const apiKey = process.env.FREEIMAGE_API_KEY;

    if (!imageBase64 || !apiKey) {
        return res.status(400).json({ error: 'Missing image data or Server API Key' });
    }

    try {
        // === THE FIX STARTS HERE ===
        // FileReader sends "data:image/png;base64,iVBOR..."
        // We need to remove the "data:image/png;base64," part because the API rejects it.
        let cleanBase64 = imageBase64;
        if (cleanBase64.includes('base64,')) {
            cleanBase64 = cleanBase64.split('base64,')[1];
        }
        // === THE FIX ENDS HERE ===

        const formData = new URLSearchParams();
        formData.append('key', apiKey);
        formData.append('action', 'upload');
        formData.append('source', cleanBase64); // Send the cleaned string
        formData.append('format', 'json');

        const response = await fetch('https://freeimage.host/api/1/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        const data = await response.json();

        if (data.status_code === 200) {
            return res.status(200).json({ success: true, url: data.image.url });
        } else {
            // Log the actual error from Freeimage for debugging
            console.error('Freeimage API Error:', data);
            throw new Error(data.error?.message || data.status_txt || 'Upload failed');
        }
    } catch (error: any) {
        console.error('Upload error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

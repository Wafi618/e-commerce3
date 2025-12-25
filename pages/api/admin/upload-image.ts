import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';
import { ImageService } from '@/lib/services/imageService';

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

    const session = await getServerSession(req, res, getAuthOptions(req, res));
    if (!session || session.user.role !== 'ADMIN') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { imageBase64 } = req.body;

    if (!imageBase64) {
        return res.status(400).json({ error: 'Missing image data' });
    }

    try {
        const url = await ImageService.uploadImage(imageBase64);
        return res.status(200).json({ success: true, url });
    } catch (error: any) {
        console.error('Upload error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

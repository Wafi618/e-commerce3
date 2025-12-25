import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';
import { ImageService } from '@/lib/services/imageService';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, getAuthOptions(req, res));
        if (session?.user?.role !== 'ADMIN') {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { base64Data } = req.body;

        if (!base64Data) {
            return res.status(400).json({ success: false, error: 'base64Data is required' });
        }

        const url = await ImageService.uploadImage(base64Data);

        return res.status(200).json({ success: true, url });

    } catch (error: any) {
        console.error('Upload API Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

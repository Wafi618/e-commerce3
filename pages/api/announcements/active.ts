import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
    }

    try {
        const announcement = await prisma.announcement.findFirst({
            where: {
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: announcement || null
        });

    } catch (error) {
        console.error('Fetch Announcement Error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

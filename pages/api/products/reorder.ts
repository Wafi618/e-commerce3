import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, getAuthOptions(req, res));
        if (session?.user?.role !== 'ADMIN') {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { items } = req.body; // Expects [{ id: number, sortOrder: number }]

        console.log('REORDER REQUEST RECEIVED:', items?.length, 'items');

        if (!Array.isArray(items)) {
            console.error('REORDER ERROR: Items is not an array');
            return res.status(400).json({ success: false, error: 'Invalid data format' });
        }

        // Transaction to ensure all updates happen or none
        await prisma.$transaction(
            items.map((item: any) => {
                const id = parseInt(item.id);
                const sortOrder = parseInt(item.sortOrder);

                if (isNaN(id)) {
                    console.warn('REORDER WARNING: Invalid ID encountered:', item.id);
                }

                return prisma.product.update({
                    where: { id: id },
                    data: { sortOrder: sortOrder } as any,
                });
            })
        );

        console.log('REORDER SUCCESS: Updated', items.length, 'products');

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Reorder error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

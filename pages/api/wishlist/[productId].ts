import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/lib/authOptions';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, getAuthOptions(req, res));

    if (!session) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = session.user.id;
    const { productId } = req.query;

    if (req.method === 'DELETE') {
        try {
            if (!productId) {
                return res.status(400).json({ success: false, message: 'Product ID required' });
            }

            // We delete by userId + productId combo to ensure ownership
            // prisma deleteMany is safest if we don't have the wishlist ID directly from frontend
            // But ideally frontend sends wishlist ID? Or Product ID?
            // Requirement says "Heart toggle", usually works with Product ID.
            // So deleteMany where userId and productId matches.

            const result = await prisma.wishlist.deleteMany({
                where: {
                    userId,
                    productId: Number(productId)
                }
            });

            if (result.count === 0) {
                return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
            }

            return res.json({ success: true, message: 'Item removed from wishlist' });
        } catch (error) {
            console.error('Remove from wishlist error:', error);
            return res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}

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

    if (req.method === 'GET') {
        try {
            const wishlist = await prisma.wishlist.findMany({
                where: { userId },
                include: {
                    product: {
                        include: {
                            options: {
                                include: {
                                    values: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return res.json({ success: true, data: wishlist });
        } catch (error) {
            console.error('Fetch wishlist error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
        }
    }

    if (req.method === 'POST') {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        try {
            // Check if already in wishlist
            const existing = await prisma.wishlist.findFirst({
                where: {
                    userId,
                    productId: Number(productId)
                }
            });

            if (existing) {
                return res.status(409).json({ success: false, message: 'Item already in wishlist' });
            }

            const newItem = await prisma.wishlist.create({
                data: {
                    userId,
                    productId: Number(productId)
                },
                include: { product: true }
            });

            return res.status(201).json({ success: true, data: newItem });
        } catch (error) {
            console.error('Add to wishlist error:', error);
            return res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const productId = parseInt(id as string);

    if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }

    if (req.method === 'GET') {
        try {
            const reviews = await prisma.review.findMany({
                where: { productId },
                include: {
                    user: {
                        select: {
                            name: true,
                            city: true,
                            country: true,
                            image: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            // Calculate average rating
            const aggregate = await prisma.review.aggregate({
                where: { productId },
                _avg: { rating: true },
                _count: { rating: true },
            });

            return res.status(200).json({
                reviews,
                average: aggregate._avg.rating || 0,
                total: aggregate._count.rating || 0,
            });
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return res.status(500).json({ message: 'Error fetching reviews' });
        }
    }

    if (req.method === 'POST') {
        try {
            const session = await getServerSession(req, res, getAuthOptions(req, res));

            if (!session || !session.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const { rating, comment } = req.body;

            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ message: 'Invalid rating' });
            }

            // Verify purchase (COMPLETED status only)
            const hasPurchased = await prisma.order.findFirst({
                where: {
                    userId: session.user.id,
                    status: 'COMPLETED',
                    orderItems: {
                        some: {
                            productId: productId,
                        },
                    },
                },
            });

            if (!hasPurchased) {
                return res.status(403).json({ message: 'You can only review products you have purchased and received.' });
            }

            // Check if already reviewed
            const existingReview = await prisma.review.findFirst({
                where: {
                    userId: session.user.id,
                    productId: productId,
                },
            });

            if (existingReview) {
                return res.status(400).json({ message: 'You have already reviewed this product.' });
            }

            const review = await prisma.review.create({
                data: {
                    rating,
                    comment,
                    userId: session.user.id,
                    productId,
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            city: true,
                            country: true,
                            image: true,
                        },
                    },
                },
            });

            return res.status(201).json(review);
        } catch (error) {
            console.error('Error creating review:', error);
            return res.status(500).json({ message: 'Error creating review' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}

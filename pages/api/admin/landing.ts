import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const landingPage = await prisma.landingPage.findFirst({
                include: { media: { orderBy: { order: 'asc' } } }
            });

            if (!landingPage) {
                // Return defaults if not found (or create one)
                return res.status(200).json({
                    heroTitle: "Discover Amazing Products",
                    heroSubtitle: "Premium Fashion & Accessories",
                    heroImage: null,
                    heroVideo: null,
                    showVideo: false,
                    videoOrientation: "landscape",
                    buttonText: "Shop Now",
                    media: []
                });
            }
            return res.status(200).json(landingPage);
        } catch (error) {
            console.error('Error fetching landing page config:', error);
            return res.status(500).json({ error: 'Failed to fetch landing page config' });
        }
    } else if (req.method === 'POST') {
        try {
            const session = await getServerSession(
                req as any,
                res as any,
                getAuthOptions(req as any, res as any)
            );

            if (!session || session.user.role !== 'ADMIN') {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const {
                heroTitle,
                heroSubtitle,
                heroImage,
                heroVideo,
                showVideo,
                videoOrientation,
                buttonText,
                media // Expecting array of { type, url, orientation, order }
            } = req.body;

            // Upsert logic
            const existing = await prisma.landingPage.findFirst();

            if (existing) {
                // Update parent and replace children
                const updated = await prisma.landingPage.update({
                    where: { id: existing.id },
                    data: {
                        heroTitle,
                        heroSubtitle,
                        heroImage,
                        heroVideo,
                        showVideo,
                        videoOrientation,
                        buttonText,
                        media: {
                            deleteMany: {}, // Clear old media
                            create: (media || []).map((m: any, index: number) => ({
                                type: m.type,
                                url: m.url,
                                orientation: m.orientation || 'landscape',
                                order: index
                            }))
                        }
                    },
                    include: { media: true }
                });
                return res.status(200).json(updated);
            } else {
                // Create new
                const created = await prisma.landingPage.create({
                    data: {
                        heroTitle,
                        heroSubtitle,
                        heroImage,
                        heroVideo,
                        showVideo,
                        videoOrientation,
                        buttonText,
                        media: {
                            create: (media || []).map((m: any, index: number) => ({
                                type: m.type,
                                url: m.url,
                                orientation: m.orientation || 'landscape',
                                order: index
                            }))
                        }
                    },
                    include: { media: true }
                });
                return res.status(200).json(created);
            }

        } catch (error) {
            console.error('Error updating landing page config:', error);
            return res.status(500).json({ error: 'Failed to update landing page config' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

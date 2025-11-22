import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getServerSession(req, res, getAuthOptions(req, res));

    if (!session || session.user?.role !== 'ADMIN') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        try {
            const announcements = await prisma.announcement.findMany({
                orderBy: { createdAt: 'desc' }
            });
            return res.status(200).json({ success: true, data: announcements });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Failed to fetch announcements' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { message, expiresAt, isActive } = req.body;
            const announcement = await prisma.announcement.create({
                data: {
                    message,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    isActive: isActive ?? true
                }
            });
            return res.status(201).json({ success: true, data: announcement });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Failed to create announcement' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const { id, message, expiresAt, isActive } = req.body;
            const announcement = await prisma.announcement.update({
                where: { id },
                data: {
                    message,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    isActive
                }
            });
            return res.status(200).json({ success: true, data: announcement });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Failed to update announcement' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.body;
            await prisma.announcement.delete({ where: { id } });
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Failed to delete announcement' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
}

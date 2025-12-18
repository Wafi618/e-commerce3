import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(
        req,
        res,
        getAuthOptions(req, res)
    );

    if (!session || session.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        try {
            const settings = await prisma.systemSetting.findMany();
            // Convert array to object for easier frontend consumption
            const settingsMap = settings.reduce((acc: any, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});

            return res.status(200).json({ success: true, data: settingsMap });
        } catch (error) {
            console.error('Error fetching settings:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch settings' });
        }
    } else if (req.method === 'POST') {
        try {
            const { key, value } = req.body;

            if (!key) {
                return res.status(400).json({ success: false, error: 'Key is required' });
            }

            const setting = await prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) },
            });

            return res.status(200).json({ success: true, data: setting });
        } catch (error) {
            console.error('Error updating setting:', error);
            return res.status(500).json({ success: false, error: 'Failed to update setting' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
    }
}

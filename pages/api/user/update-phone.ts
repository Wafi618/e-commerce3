import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const phoneSchema = z.object({
    phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number must be at most 15 digits'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
    }

    try {
        const session = await getServerSession(req, res, authOptions);

        if (!session || !session.user?.email) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const result = phoneSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error.issues[0].message });
        }

        const { phone } = result.data;

        // Update user phone and remove restricted access
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                phone,
                restrictedAccess: false,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Phone number updated successfully',
            data: updatedUser,
        });
    } catch (error) {
        console.error('Phone update error:', error);
        return res.status(500).json({ success: false, error: 'Failed to update phone number' });
    }
}

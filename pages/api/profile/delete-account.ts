import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, getAuthOptions(req, res));

        if (!session) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const userId = session.user.id;

        // We might want to keep some records or anonymize them instead for accounting,
        // but for "Delete Account" we should at least remove the user's personal info.
        // Given Prisma relationships, we might need to handle related items.

        // Check if user is Admin, maybe prevent deleting last admin or something.
        if (session.user.role === 'ADMIN') {
            const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
            if (adminCount <= 1) {
                return res.status(400).json({ success: false, error: 'Cannot delete the only admin account.' });
            }
        }

        // Delete related entities first if they aren't set to Cascade
        // (Cart, Wishlist, Addresses usually cascade or are small)
        // Orders should probably stay for records but be detached or user email anonymized.
        // For simplicity here, we'll use a transaction.

        await prisma.$transaction([
            prisma.cartItem.deleteMany({ where: { userId } }),
            prisma.wishlist.deleteMany({ where: { userId } }),
            prisma.address.deleteMany({ where: { userId } }),
            prisma.user.delete({ where: { id: userId } }),
        ]);

        return res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Account deletion error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete account',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, getAuthOptions(req, res));

    if (!session || session.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.query;

    if (req.method === 'DELETE') {
        try {
            await prisma.coupon.delete({
                where: { id: String(id) }
            });
            return res.json({ success: true, message: 'Coupon deleted' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Failed to delete coupon' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const {
                code,
                type,
                value,
                minOrderAmount,
                maxDiscountAmount,
                usageLimit,
                oneUsePerCustomer,
                expiresAt,
                isActive
            } = req.body;

            const coupon = await prisma.coupon.update({
                where: { id: String(id) },
                data: {
                    code: code?.trim(),
                    type,
                    value,
                    minOrderAmount: minOrderAmount,
                    maxDiscountAmount: maxDiscountAmount,
                    usageLimit: usageLimit ? parseInt(usageLimit) : null,
                    oneUsePerCustomer,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    isActive,
                }
            });
            return res.json({ success: true, data: coupon });
        } catch (error) {
            console.error('Update coupon error:', error);
            return res.status(500).json({ success: false, message: 'Failed to update coupon' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}

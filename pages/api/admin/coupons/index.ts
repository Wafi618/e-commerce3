import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, getAuthOptions(req, res));

    if (!session || session.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        try {
            const coupons = await prisma.coupon.findMany({
                orderBy: { createdAt: 'desc' }
            });
            return res.json({ success: true, data: coupons });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
        }
    }

    if (req.method === 'POST') {
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

            // Basic Validation
            if (!code || !type || value === undefined) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const coupon = await prisma.coupon.create({
                data: {
                    code: code.trim(),
                    type,
                    value,
                    minOrderAmount: minOrderAmount || null,
                    maxDiscountAmount: maxDiscountAmount || null,
                    usageLimit: usageLimit ? parseInt(usageLimit) : null,
                    oneUsePerCustomer: oneUsePerCustomer || false,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    isActive: isActive !== undefined ? isActive : true,
                }
            });

            return res.status(201).json({ success: true, data: coupon });
        } catch (error: any) {
            if (error.code === 'P2002') { // Unique constraint violation
                return res.status(409).json({ success: false, message: 'Coupon code already exists' });
            }
            console.error('Create coupon error:', error);
            return res.status(500).json({ success: false, message: 'Failed to create coupon' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}

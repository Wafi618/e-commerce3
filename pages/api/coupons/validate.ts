
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';
import { couponService } from '../../../lib/services/couponService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, getAuthOptions(req, res));
        const userId = session?.user?.id; // Optional: Coupon might be validated by guest? 
        // Usually coupons can be checked by guests, but strict 'one per customer' needs ID.
        // We'll pass ID if available.

        const { code, cartTotal } = req.body;

        if (!code || cartTotal === undefined) {
            return res.status(400).json({ message: 'Code and cartTotal are required' });
        }

        const result = await couponService.validateCoupon(code, userId, Number(cartTotal));

        if (!result.valid) {
            return res.status(400).json({ message: result.error, valid: false });
        }

        return res.json({ success: true, valid: true, coupon: result.coupon });

    } catch (error) {
        console.error('Coupon validation error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

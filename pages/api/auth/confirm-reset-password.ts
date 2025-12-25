import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({
            success: false,
            error: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                error: 'Token and new password are required',
            });
        }

        // Decode to get user ID (without verifying signature yet)
        const decoded: any = jwt.decode(token);

        if (!decoded || !decoded.id) {
            return res.status(400).json({
                success: false,
                error: 'Invalid token',
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Verify signature using the secret user-specific key
        const secret = (process.env.NEXTAUTH_SECRET || 'secret') + user.password;

        try {
            jwt.verify(token, secret);
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                failedResetAttempts: 0,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Password successfully reset',
        });

    } catch (error) {
        console.error('Reset Password Confirmation Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to reset password',
        });
    }
}

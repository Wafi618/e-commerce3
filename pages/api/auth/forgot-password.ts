import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/services/emailService';
import jwt from 'jsonwebtoken';

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
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required',
            });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Return success even if user not found to prevent enumeration
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.',
            });
        }

        if (!user.password) {
            // Google account
            return res.status(200).json({
                success: true,
                message: 'This account uses Google Sign-In. Please log in with Google.',
            });
        }

        // Generate token
        const secret = (process.env.NEXTAUTH_SECRET || 'secret') + user.password;
        const token = jwt.sign({ id: user.id, email: user.email }, secret, {
            expiresIn: '1h',
        });

        await sendPasswordResetEmail(user.email, token, user.name || 'Customer');

        return res.status(200).json({
            success: true,
            message: 'Password reset link sent.',
        });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process request',
        });
    }
}

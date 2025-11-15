import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const getUserFromToken = (req: NextApiRequest) => {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies['auth-token'];

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

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
    const adminId = getUserFromToken(req);

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (admin?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    const { customerId, newPassword } = req.body;

    // Validation
    if (!customerId || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID and new password are required',
      });
    }

    // Check if customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update customer password and reset failed attempts
    await prisma.user.update({
      where: { id: customerId },
      data: {
        password: hashedPassword,
        failedResetAttempts: 0,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Customer password reset successfully',
    });
  } catch (error) {
    console.error('Admin Reset Password Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset customer password',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}

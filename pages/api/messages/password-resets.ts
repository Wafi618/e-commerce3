import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

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
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`,
    });
  }

  const userId = getUserFromToken(req);

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    // Get all password reset messages
    const passwordResetMessages = await prisma.message.findMany({
      where: {
        isPasswordReset: true,
        receiverId: userId, // Messages sent to this admin
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: passwordResetMessages,
    });
  } catch (error) {
    console.error('Get Password Reset Messages Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch password reset messages',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}

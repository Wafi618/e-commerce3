import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    // Get token from cookie or Authorization header
    const token = req.cookies['auth-token'] || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    const { darkMode } = req.body;

    if (typeof darkMode !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'darkMode must be a boolean value',
      });
    }

    // Update user's dark mode preference
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { darkMode },
      select: {
        id: true,
        darkMode: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Theme preference updated successfully',
    });
  } catch (error) {
    console.error('Update Theme Error:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to update theme preference',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

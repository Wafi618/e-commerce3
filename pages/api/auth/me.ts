import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/serverAuth';

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

  const user = await requireUser(req, res);
  if (!user) return;

  try {
    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        city: true,
        country: true,
        address: true,
        house: true,
        floor: true,
        darkMode: true,
        restrictedAccess: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: dbUser,
    });
  } catch (error) {
    console.error('Auth Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

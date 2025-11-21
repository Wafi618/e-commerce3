import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';

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

  const session = await getServerSession(req, res, getAuthOptions(req, res));
  const userId = session?.user?.id;

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

    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        city: true,
        country: true,
        address: true,
        house: true,
        floor: true,
        restrictedAccess: true,
        failedResetAttempts: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error('Get Customers Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

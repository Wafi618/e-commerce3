import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';


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

  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error('Get Admins Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch admins',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}

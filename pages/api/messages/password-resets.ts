import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/serverAuth';

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

  const user = await requireAdmin(req, res);
  if (!user) return;

  const userId = user.userId;

  try {
    // Check if user is admin (Already checked by requireAdmin)
    
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

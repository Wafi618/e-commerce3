import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from './[...nextauth]';

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
    const session = await getServerSession(req, res, getAuthOptions(req, res));
    const userId = session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { subject, message } = req.body;

    // Validation
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Subject and message are required',
      });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phone: true,
      },
    });

    // Find all admin users to send the message to
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    if (!admins || admins.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No admin found',
      });
    }

    // Create password reset messages for all admins
    const passwordResetMessages = await Promise.all(
      admins.map((admin) =>
        prisma.message.create({
          data: {
            senderId: userId,
            receiverId: admin.id,
            subject: `[Password Reset] ${subject}`,
            message: `${message}\n\nUser Phone: ${user?.phone || 'Not provided'}`,
            isPasswordReset: true,
          },
        })
      )
    );

    return res.status(201).json({
      success: true,
      message: `Password reset request sent to ${admins.length} admin(s)`,
      data: passwordResetMessages,
    });
  } catch (error) {
    console.error('Request Password Reset Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send password reset request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

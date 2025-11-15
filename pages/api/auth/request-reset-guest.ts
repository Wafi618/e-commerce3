import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';


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
    const { email, subject, message } = req.body;

    // Validation
    if (!email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Email, subject, and message are required',
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        phone: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email',
      });
    }

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
            senderId: user.id,
            receiverId: admin.id,
            subject: `[Password Reset Request] ${subject}`,
            message: `${message}\n\nUser Email: ${email}\nUser Phone: ${user.phone || 'Not provided'}`,
            isPasswordReset: true,
          },
        })
      )
    );

    return res.status(201).json({
      success: true,
      message: 'Password reset request sent to admin. They will contact you via phone to verify your identity.',
      data: passwordResetMessages,
    });
  } catch (error) {
    console.error('Guest Password Reset Request Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send password reset request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}

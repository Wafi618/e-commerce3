import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/serverAuth';

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

  const user = await requireUser(req, res);
  if (!user) return;

  const userId = user.userId;

  try {
    const { receiverId, subject, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Receiver and message are required',
      });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        subject: subject || null,
        message,
      },
      include: {
        sender: {
          select: {
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}

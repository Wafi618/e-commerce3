import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/serverAuth';

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

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required',
      });
    }

    // Reset failed attempts and remove restrictions
    const updatedUser = await prisma.user.update({
      where: { id: customerId },
      data: {
        failedResetAttempts: 0,
        restrictedAccess: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Account unlocked successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Unlock Account Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to unlock account',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}

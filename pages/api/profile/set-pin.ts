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

  try {
    const userId = user.userId;
    const { pin } = req.body;

    // Validation
    if (!pin) {
      return res.status(400).json({
        success: false,
        error: 'PIN is required',
      });
    }

    // Validate PIN is 3 digits
    if (!/^\d{3}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be exactly 3 digits',
      });
    }

    // Update user PIN
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        resetPin: pin,
        restrictedAccess: false, // User now has PIN, remove restrictions
      },
    });

    return res.status(200).json({
      success: true,
      message: 'PIN set successfully',
      data: {
        restrictedAccess: updatedUser.restrictedAccess,
      },
    });
  } catch (error) {
    console.error('Set PIN Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to set PIN',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
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
    const { customerId, newPassword } = req.body;

    // Validation
    if (!customerId || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID and new password are required',
      });
    }

    // Check if customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update customer password and reset failed attempts
    await prisma.user.update({
      where: { id: customerId },
      data: {
        password: hashedPassword,
        failedResetAttempts: 0,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Customer password reset successfully',
    });
  } catch (error) {
    console.error('Admin Reset Password Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset customer password',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';


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
    const { email, method, securityAnswer, pin, newPassword } = req.body;

    // Validation
    if (!email || !method || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email, method, and new password are required',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user has exceeded max attempts
    if (user.failedResetAttempts >= 10) {
      return res.status(403).json({
        success: false,
        error: 'Maximum reset attempts exceeded. Please contact admin for assistance.',
      });
    }

    let isValid = false;

    if (method === 'security-question') {
      // Security question: last 4 digits of phone number
      if (!user.phone) {
        return res.status(400).json({
          success: false,
          error: 'No phone number on file. Please use another method or contact admin.',
        });
      }

      const last4Digits = user.phone.slice(-4);
      isValid = securityAnswer === last4Digits;
    } else if (method === 'pin') {
      // PIN method
      if (!user.resetPin) {
        return res.status(400).json({
          success: false,
          error: 'No PIN set. Please use another method or contact admin.',
        });
      }

      isValid = pin === user.resetPin;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid reset method',
      });
    }

    if (!isValid) {
      // Increment failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedResetAttempts: user.failedResetAttempts + 1,
        },
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid security answer or PIN',
        attemptsRemaining: 10 - (user.failedResetAttempts + 1),
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        failedResetAttempts: 0,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Password Reset Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}

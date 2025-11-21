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
    const { darkMode } = req.body;

    if (typeof darkMode !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'darkMode must be a boolean value',
      });
    }

    // Update user's dark mode preference
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: { darkMode },
      select: {
        id: true,
        darkMode: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Theme preference updated successfully',
    });
  } catch (error) {
    console.error('Update Theme Error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to update theme preference',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

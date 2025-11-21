import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/serverAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`,
    });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  const userId = user.userId;

  try {
    const { name, phone, city, country, address, house, floor } = req.body;

    // Get current user to check if they have resetPin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { resetPin: true },
    });

    // If phone is being added, remove restricted access
    const hasPhoneOrPin = !!(phone || currentUser?.resetPin);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        city,
        country,
        address,
        house,
        floor,
        restrictedAccess: !hasPhoneOrPin,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        city: true,
        country: true,
        address: true,
        house: true,
        floor: true,
        restrictedAccess: true,
        darkMode: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Profile Update Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

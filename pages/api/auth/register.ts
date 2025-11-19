import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/schemas';


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
    // Zod Validation
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.issues[0].message,
      });
    }

    const { email, password, name, phone, role } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        phone,
        role: role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: user,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register user',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}

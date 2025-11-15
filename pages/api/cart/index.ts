import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get user from token
const getUserFromToken = (req: NextApiRequest) => {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies['auth-token'];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = getUserFromToken(req);

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    if (req.method === 'GET') {
      // Get user's cart
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: true,
        },
      });

      // Transform to frontend format
      const cart = cartItems.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        stock: item.product.stock,
        category: item.product.category,
        quantity: item.quantity,
      }));

      return res.status(200).json({
        success: true,
        data: cart,
      });
    } else if (req.method === 'POST') {
      // Update cart (sync from frontend)
      const { cart } = req.body;

      if (!Array.isArray(cart)) {
        return res.status(400).json({
          success: false,
          error: 'Cart must be an array',
        });
      }

      // Clear existing cart
      await prisma.cartItem.deleteMany({
        where: { userId },
      });

      // Add new cart items
      if (cart.length > 0) {
        await prisma.cartItem.createMany({
          data: cart.map((item: any) => ({
            userId,
            productId: item.id,
            quantity: item.quantity,
          })),
          skipDuplicates: true,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cart synced successfully',
      });
    } else if (req.method === 'DELETE') {
      // Clear cart
      await prisma.cartItem.deleteMany({
        where: { userId },
      });

      return res.status(200).json({
        success: true,
        message: 'Cart cleared successfully',
      });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} Not Allowed`,
      });
    }
  } catch (error) {
    console.error('Cart API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process cart operation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

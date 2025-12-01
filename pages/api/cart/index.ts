import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/serverAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireUser(req, res);
  if (!user) return;

  const userId = user.userId;

  try {
    if (req.method === 'GET') {
      // Get user's cart
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              options: {
                include: {
                  values: true
                }
              }
            }
          },
        },
      });

      // Transform to frontend format
      const cart = cartItems.map(item => {
        // Determine correct image
        let image = item.product.image;
        
        // 1. Check if selected options have an image
        if (item.selectedOptions) {
          const selectedOpts = item.selectedOptions as Record<string, string>;
          for (const [optName, optValue] of Object.entries(selectedOpts)) {
            const option = item.product.options.find(o => o.name === optName);
            if (option) {
              const value = option.values.find(v => v.name === optValue);
              if (value && value.image && value.image.trim() !== '') {
                image = value.image;
                break;
              }
            }
          }
        }

        // 2. Fallback: Check if main image is empty, then use ANY option image
        if (!image || image.trim() === '') {
           const fallbackOption = item.product.options.find(o => o.values.some(v => v.image && v.image.trim() !== ''));
           if (fallbackOption) {
             const fallbackValue = fallbackOption.values.find(v => v.image && v.image.trim() !== '');
             if (fallbackValue) {
               image = fallbackValue.image || '';
             }
           }
        }

        return {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image: image,
          stock: item.product.stock,
          category: item.product.category,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
        };
      });

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
            selectedOptions: item.selectedOptions || null,
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
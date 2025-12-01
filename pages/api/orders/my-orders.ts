import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/serverAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`,
    });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  const userId = user.userId;

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format orders for frontend
    const formattedOrders = orders.map(order => ({
      id: order.id,
      customer: order.customer,
      email: order.email,
      total: order.total,
      status: order.status.toLowerCase(),
      date: order.createdAt.toISOString().split('T')[0],
      items: order.orderItems.length,
      orderItems: order.orderItems.map((item: any) => {
          let image = item.product.image;
          
          // Logic to determine image based on selectedOptions or fallback
          if (item.selectedOptions) {
             const selectedOpts = item.selectedOptions as Record<string, string>;
             for (const [optName, optValue] of Object.entries(selectedOpts)) {
               const option = item.product.options.find((o: any) => o.name === optName);
               if (option) {
                 const value = option.values.find((v: any) => v.name === optValue);
                 if (value && value.image && value.image.trim() !== '') {
                   image = value.image;
                   break;
                 }
               }
             }
          }

          // Fallback if main image is empty
          if (!image || image.trim() === '') {
             const fallbackOption = item.product.options.find((o: any) => o.values.some((v: any) => v.image && v.image.trim() !== ''));
             if (fallbackOption) {
               const fallbackValue = fallbackOption.values.find((v: any) => v.image && v.image.trim() !== '');
               if (fallbackValue) {
                 image = fallbackValue.image || '';
               }
             }
          }

          return {
            ...item,
            product: {
              ...item.product,
              image: image
            }
          };
        }),
    }));

    return res.status(200).json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error('My Orders API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}
